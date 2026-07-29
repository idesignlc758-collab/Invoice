import Link from "next/link";
import { getCurrentUserWithInvoices } from "@/lib/current-user";
import { InvoiceTable } from "@/components/invoice-table";
import { formatCents } from "@/lib/format";

export default async function InvoicesPage() {
  const user = await getCurrentUserWithInvoices();
  const openCents = user.invoices
    .filter((invoice) => invoice.status === "open")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidCents = user.invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">All invoices</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Invoices</h1>
        </div>
        <Link
          href="/invoices/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New invoice
        </Link>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Awaiting</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(openCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Paid</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(paidCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Total invoices</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {user.invoices.length}
          </p>
        </div>
      </section>
      <InvoiceTable invoices={user.invoices} />
    </main>
  );
}
