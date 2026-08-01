import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { SaleReceiptActions } from "@/components/sale-receipt-actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default async function SaleReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const receipt = await prisma.saleReceipt.findFirst({
    where: { id, userId: user.id },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  if (!receipt) notFound();

  const isVoid = receipt.status === "void";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8 md:max-w-lg md:py-12">
      <Link href="/sale-receipts" className="mb-8 self-start text-sm text-muted">
        ← Sale Receipts
      </Link>

      <div className="mb-2 flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isVoid ? "bg-line text-muted" : "bg-success-soft text-success"
          }`}
        >
          {isVoid ? "Void" : "Completed"}
        </span>
        <span className="text-xs text-muted">{receipt.receiptNumber}</span>
      </div>

      <p className={`font-display text-5xl font-extrabold tabular-nums tracking-tight ${isVoid ? "text-muted line-through" : ""}`}>
        {formatCents(receipt.total, receipt.currency)}
      </p>

      <p className="mt-2 text-sm text-muted">
        {receipt.customerName} · {receipt.customerEmail}
      </p>
      <p className="text-sm text-muted">{formatDate(receipt.saleDate)}</p>

      <section className="mt-8 rounded-2xl border border-line bg-card p-5">
        <p className="mb-3 text-xs uppercase tracking-wide text-muted">Items</p>
        <div className="flex flex-col gap-2.5">
          {receipt.lineItems.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="min-w-0 truncate">
                {item.description}
                {item.quantity > 1 && <span className="text-muted"> × {item.quantity}</span>}
              </span>
              <span className="shrink-0 tabular-nums">{formatCents(item.amount, receipt.currency)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span className="tabular-nums">{formatCents(receipt.subtotal, receipt.currency)}</span>
          </div>
          {receipt.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Tax ({receipt.taxPercent}%)</span>
              <span className="tabular-nums">{formatCents(receipt.taxAmount, receipt.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatCents(receipt.total, receipt.currency)}</span>
          </div>
        </div>
      </section>

      {(receipt.paymentMethod || receipt.notes) && (
        <section className="mt-4 rounded-2xl border border-line bg-card p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted">Details</p>
          <div className="flex flex-col gap-3 text-sm">
            {receipt.paymentMethod && (
              <div>
                <p className="font-medium">Payment method</p>
                <p className="text-muted">
                  {receipt.paymentMethod}
                  {receipt.paymentReference ? ` · ${receipt.paymentReference}` : ""}
                </p>
              </div>
            )}
            {receipt.notes && (
              <div>
                <p className="font-medium">Notes</p>
                <p className="whitespace-pre-wrap leading-relaxed text-muted">{receipt.notes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="flex-1" />

      <div className="mt-8">
        <SaleReceiptActions receiptId={receipt.id} isVoid={isVoid} />
      </div>
    </main>
  );
}
