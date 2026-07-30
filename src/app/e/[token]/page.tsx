import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { EstimateResponseActions } from "@/components/estimate-response-actions";

function formatDate(date: Date | null) {
  if (!date) return "No expiration";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function compactAddress(estimate: {
  brandAddressLine1: string | null;
  brandAddressLine2: string | null;
  brandCity: string | null;
  brandState: string | null;
  brandPostalCode: string | null;
  brandCountry: string | null;
}) {
  return [
    estimate.brandAddressLine1,
    estimate.brandAddressLine2,
    [estimate.brandCity, estimate.brandState, estimate.brandPostalCode].filter(Boolean).join(", "),
    estimate.brandCountry,
  ].filter(Boolean);
}

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const estimate = await prisma.estimate.findUnique({
    where: { publicToken: token },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  if (!estimate) notFound();

  if (!estimate.viewedAt && estimate.status === "sent") {
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "viewed", viewedAt: new Date() },
    });
    estimate.status = "viewed";
  }

  const brandColor = estimate.brandColor ?? "#c81010";
  const businessName = estimate.brandBusinessName ?? "Your service provider";
  const address = compactAddress(estimate);
  const expired = Boolean(estimate.expiresAt && estimate.expiresAt < new Date());
  const closed = ["accepted", "declined", "canceled", "converted", "expired"].includes(estimate.status);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground md:py-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <div className="rounded-[1.75rem] border border-line bg-card p-5 shadow-[0_18px_60px_-42px_rgba(0,0,0,0.55)] md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {estimate.brandLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={estimate.brandLogoUrl}
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
                <p className="truncate text-sm text-muted">{estimate.brandSupportEmail}</p>
                {address.length > 0 && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{address.join(" - ")}</p>
                )}
              </div>
            </div>
            <StatusPill status={expired ? "expired" : estimate.status} />
          </div>

          <div className="mt-9">
            <p className="text-sm text-muted">Estimate total</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums md:text-6xl">
              {formatCents(estimate.amount, estimate.currency)}
            </p>
            <p className="mt-2 text-sm text-muted">
              For {estimate.clientName ? `${estimate.clientName} - ` : ""}
              {estimate.clientEmail}
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Service provider</p>
              <p className="mt-2 font-medium">{businessName}</p>
              {address.map((line) => (
                <p key={line} className="text-sm text-muted">
                  {line}
                </p>
              ))}
            </div>
            <div className="rounded-2xl border border-line bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Estimate details</p>
              <div className="mt-2 flex justify-between gap-4 text-sm">
                <span className="text-muted">Valid until</span>
                <span>{formatDate(estimate.expiresAt)}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4 text-sm">
                <span className="text-muted">Created</span>
                <span>{formatDate(estimate.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-line bg-background p-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-muted">Items</p>
            <div className="flex flex-col gap-3">
              {estimate.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{item.description}</span>
                    {item.quantity > 1 && (
                      <span className="text-xs text-muted">
                        {item.quantity} x {formatCents(item.unitAmount, estimate.currency)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCents(item.amount, estimate.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="tabular-nums">{formatCents(estimate.subtotal, estimate.currency)}</span>
              </div>
              {estimate.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Tax</span>
                  <span className="tabular-nums">{formatCents(estimate.taxAmount, estimate.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total estimate</span>
                <span className="tabular-nums">{formatCents(estimate.amount, estimate.currency)}</span>
              </div>
            </div>
          </div>

          {estimate.clientNote && (
            <div className="mt-4 rounded-2xl border border-line bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Note</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {estimate.clientNote}
              </p>
            </div>
          )}

          {estimate.clientTerms && (
            <details className="mt-4 rounded-2xl border border-line bg-background p-4">
              <summary className="cursor-pointer list-none text-sm font-bold">Terms & Conditions</summary>
              <p className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {estimate.clientTerms}
              </p>
            </details>
          )}

          <EstimateResponseActions
            publicToken={estimate.publicToken}
            brandColor={brandColor}
            terms={estimate.clientTerms}
            disabled={closed || expired}
          />

          <div className="mt-3 rounded-2xl bg-background px-4 py-3 text-center">
            <p className="text-xs font-medium text-foreground">This is an estimate, not a payment request.</p>
            <p className="mt-1 text-xs text-muted">
              If accepted, the service provider can convert it into a secure Stripe invoice.
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-muted">
            {estimate.brandFooter ??
              "Estimate prepared by the service provider. Payment will be processed securely after invoice approval."}
          </p>
        </div>

        <p className="text-center text-xs text-muted">
          Powered by{" "}
          <Link href="/" className="font-medium text-foreground">
            iDesignLC
          </Link>
        </p>
      </section>
    </main>
  );
}
