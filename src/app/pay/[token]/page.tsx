import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";

function formatDate(date: Date | null) {
  if (!date) return "Due on receipt";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  if (!invoice) notFound();

  const brandColor = invoice.brandColor ?? "#c81010";
  const businessName = invoice.brandBusinessName ?? "Your service provider";
  const canPay = invoice.status === "open" && Boolean(invoice.hostedInvoiceUrl);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground">
      <section className="mx-auto flex w-full max-w-xl flex-col gap-5">
        <div className="rounded-[2rem] border border-line bg-card p-5 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {invoice.brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={invoice.brandLogoUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : (
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl font-display font-bold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {businessName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-extrabold">{businessName}</p>
                <p className="truncate text-sm text-muted">{invoice.brandSupportEmail}</p>
              </div>
            </div>
            <StatusPill status={invoice.status} />
          </div>

          <div className="mt-9">
            <p className="text-sm text-muted">Invoice total</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums md:text-6xl">
              {formatCents(invoice.amount, invoice.currency)}
            </p>
            <p className="mt-2 text-sm text-muted">
              To {invoice.clientName ? `${invoice.clientName} - ` : ""}
              {invoice.clientEmail}
            </p>
          </div>

          <div className="mt-7 rounded-3xl border border-line bg-background p-4">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-muted">Due</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.stripeNumber && (
              <div className="mt-2 flex justify-between gap-4 text-sm">
                <span className="text-muted">Invoice</span>
                <span>{invoice.stripeNumber}</span>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-line bg-background p-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-muted">Items</p>
            <div className="flex flex-col gap-3">
              {invoice.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{item.description}</span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-muted">
                        {item.quantity} x {formatCents(item.unitAmount, invoice.currency)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCents(item.amount, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums">{formatCents(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Tax</span>
                  <span className="tabular-nums">{formatCents(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="tabular-nums">{formatCents(invoice.amount, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {canPay ? (
            <a
              href={invoice.hostedInvoiceUrl!}
              className="mt-6 flex min-h-14 items-center justify-center rounded-2xl font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              Pay securely
            </a>
          ) : (
            <div className="mt-6 rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
              This invoice is not currently payable.
            </div>
          )}

          {invoice.invoicePdfUrl && (
            <a
              href={invoice.invoicePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-line text-sm font-medium"
            >
              Download invoice PDF
            </a>
          )}

          <p className="mt-5 text-center text-xs text-muted">
            {invoice.brandFooter ?? "Payment is processed securely by iDesignLC."}
          </p>
        </div>

        <p className="text-center text-xs text-muted">
          Powered by <Link href="/" className="font-medium text-foreground">iDesignLC</Link>
        </p>
      </section>
    </main>
  );
}
