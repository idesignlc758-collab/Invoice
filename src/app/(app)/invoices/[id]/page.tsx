import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatCents } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { InvoiceActions } from "@/components/invoice-actions";

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Scoped to the signed-in user, so an invoice ID from elsewhere resolves to
  // a 404 rather than exposing someone else's client and amounts.
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  if (!invoice) notFound();

  const netCents = invoice.amount - invoice.feeAmount;
  const currency = invoice.currency;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8 md:max-w-lg md:py-12">
      <Link href="/dashboard" className="mb-8 self-start text-sm text-muted">
        ← Dashboard
      </Link>

      <div className="mb-2 flex items-center gap-3">
        <StatusPill status={invoice.status} />
        <span className="text-xs text-muted">
          Sent {formatDate(invoice.createdAt)}
        </span>
      </div>

      <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight">
        {formatCents(invoice.amount, currency)}
      </p>

      <p className="mt-2 text-sm text-muted">
        {invoice.clientName ? `${invoice.clientName} · ` : ""}
        {invoice.clientEmail}
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted">Items</p>

        <div className="flex flex-col gap-2.5">
          {invoice.lineItems.length === 0 && (
            <div className="flex justify-between gap-4 text-sm">
              <span className="min-w-0 truncate">{invoice.description}</span>
              <span className="shrink-0 tabular-nums">
                {formatCents(invoice.subtotal || invoice.amount, currency)}
              </span>
            </div>
          )}

          {invoice.lineItems.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="min-w-0 truncate">
                {item.description}
                {item.quantity > 1 && (
                  <span className="text-muted"> × {item.quantity}</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatCents(item.amount, currency)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">
              {formatCents(invoice.subtotal || invoice.amount, currency)}
            </span>
          </div>

          {invoice.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Tax ({invoice.taxPercent}%)</span>
              <span className="tabular-nums">{formatCents(invoice.taxAmount, currency)}</span>
            </div>
          )}

          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatCents(invoice.amount, currency)}</span>
          </div>

          <div className="flex justify-between border-t border-line pt-2">
            <span className="text-muted">Platform fee</span>
            <span className="tabular-nums">−{formatCents(invoice.feeAmount, currency)}</span>
          </div>

          <div className="flex justify-between font-medium">
            <span>{invoice.status === "paid" ? "You received" : "You'll receive"}</span>
            <span className="tabular-nums text-success">{formatCents(netCents, currency)}</span>
          </div>
        </div>
      </section>

      <dl className="mt-6 flex flex-col gap-2 text-sm">
        {invoice.dueDate && (
          <div className="flex justify-between">
            <dt className="text-muted">Due</dt>
            <dd>{formatDate(invoice.dueDate)}</dd>
          </div>
        )}
        {invoice.paidAt && (
          <div className="flex justify-between">
            <dt className="text-muted">Paid</dt>
            <dd className="text-success">{formatDate(invoice.paidAt)}</dd>
          </div>
        )}
      </dl>

      <div className="flex-1" />

      <div className="mt-8">
        <InvoiceActions
          hostedInvoiceUrl={invoice.hostedInvoiceUrl}
          amountLabel={formatCents(invoice.amount, currency)}
        />
      </div>
    </main>
  );
}
