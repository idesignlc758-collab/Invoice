import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { formatCents } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";
import { EstimateActions } from "@/components/estimate-actions";

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const estimate = await prisma.estimate.findFirst({
    where: { id, userId: user.id },
    include: { lineItems: { orderBy: { position: "asc" } }, convertedInvoice: true },
  });

  if (!estimate) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const publicEstimateUrl = appUrl
    ? `${appUrl}/e/${estimate.publicToken}`
    : `/e/${estimate.publicToken}`;

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_20rem] md:px-8 md:py-8">
      <section>
        <Link href="/estimates" className="mb-8 inline-flex text-sm text-muted">
          Back to estimates
        </Link>

        <div className="mb-2 flex items-center gap-3">
          <StatusPill status={estimate.status} />
          <span className="text-xs text-muted">Created {formatDate(estimate.createdAt)}</span>
        </div>

        <p className="font-display text-5xl font-extrabold tracking-tight tabular-nums">
          {formatCents(estimate.amount, estimate.currency)}
        </p>
        <p className="mt-2 text-sm text-muted">
          {estimate.clientName ? `${estimate.clientName} - ` : ""}
          {estimate.clientEmail}
        </p>

        <section className="mt-8 rounded-2xl border border-line bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted">Items</p>
          <div className="flex flex-col gap-2.5">
            {estimate.lineItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="min-w-0 truncate">
                  {item.description}
                  {item.quantity > 1 && <span className="text-muted"> x {item.quantity}</span>}
                </span>
                <span className="shrink-0 tabular-nums">
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
                <span className="text-muted">Tax ({estimate.taxPercent}%)</span>
                <span className="tabular-nums">{formatCents(estimate.taxAmount, estimate.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total estimate</span>
              <span className="tabular-nums">{formatCents(estimate.amount, estimate.currency)}</span>
            </div>
          </div>
        </section>

        {(estimate.clientNote || estimate.privateMemo || estimate.clientTerms) && (
          <section className="mt-4 rounded-2xl border border-line bg-card p-5">
            <p className="mb-3 text-xs uppercase tracking-wide text-muted">Details</p>
            <div className="grid gap-4 text-sm">
              {estimate.clientNote && (
                <div>
                  <p className="font-medium">Client note</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted">
                    {estimate.clientNote}
                  </p>
                </div>
              )}
              {estimate.clientTerms && (
                <div>
                  <p className="font-medium">Terms</p>
                  <p className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-3 leading-relaxed text-muted">
                    {estimate.clientTerms}
                  </p>
                </div>
              )}
              {estimate.privateMemo && (
                <div>
                  <p className="font-medium">Private memo</p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted">
                    {estimate.privateMemo}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      <aside className="md:sticky md:top-8 md:self-start">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="font-display text-lg font-bold">Estimate workflow</p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Expires</dt>
              <dd>{formatDate(estimate.expiresAt) ?? "Not set"}</dd>
            </div>
            {estimate.acceptedAt && (
              <div className="flex justify-between">
                <dt className="text-muted">Accepted</dt>
                <dd>{formatDate(estimate.acceptedAt)}</dd>
              </div>
            )}
            {estimate.convertedInvoice && (
              <div className="flex justify-between">
                <dt className="text-muted">Invoice</dt>
                <dd>
                  <Link href={`/invoices/${estimate.convertedInvoice.id}`} className="text-accent">
                    View
                  </Link>
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-5">
            <EstimateActions
              estimateId={estimate.id}
              status={estimate.status}
              publicEstimateUrl={publicEstimateUrl}
            />
          </div>
        </div>
      </aside>
    </main>
  );
}
