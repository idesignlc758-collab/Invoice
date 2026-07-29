import Link from "next/link";
import { getCurrentUserWithInvoices } from "@/lib/current-user";
import { formatCents } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";

function formatDate(date: Date | null) {
  if (!date) return "Pending";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function PaymentsPage() {
  const user = await getCurrentUserWithInvoices();
  const paidInvoices = user.invoices.filter((invoice) => invoice.status === "paid");
  const paidGross = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidFees = paidInvoices.reduce((sum, invoice) => sum + invoice.feeAmount, 0);
  const net = paidGross - paidFees;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Money movement</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Payments</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Gross collected</p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">
            {formatCents(paidGross)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Platform fees</p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">
            {formatCents(paidFees)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Net to account</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-success tabular-nums">
            {formatCents(net)}
          </p>
        </div>
      </section>
      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Payment activity</h2>
          <a
            href="/api/dashboard-link"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent"
          >
            Stripe dashboard
          </a>
        </div>
        <div className="flex flex-col">
          {user.invoices.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">Payment activity appears after invoices are sent.</p>
          )}
          {user.invoices.slice(0, 20).map((invoice) => (
            <Link
              key={invoice.id}
              href={`/invoices/${invoice.id}`}
              className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{invoice.description}</p>
                <p className="truncate text-sm text-muted">
                  {invoice.clientName || invoice.clientEmail} - {formatDate(invoice.paidAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display font-bold tabular-nums">
                  {formatCents(invoice.amount, invoice.currency)}
                </p>
                <StatusPill status={invoice.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
