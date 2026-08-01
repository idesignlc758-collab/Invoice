import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { SaleReceiptTable } from "@/components/sale-receipt-table";
import { formatCents } from "@/lib/format";

export default async function SaleReceiptsPage() {
  const user = await getCurrentUser();
  const receipts = await prisma.saleReceipt.findMany({
    where: { userId: user.id },
    orderBy: { saleDate: "desc" },
  });

  const completed = receipts.filter((receipt) => receipt.status === "completed");
  const totalCents = completed.reduce((sum, receipt) => sum + receipt.total, 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonthCents = completed
    .filter((receipt) => receipt.saleDate >= monthStart)
    .reduce((sum, receipt) => sum + receipt.total, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Money already collected</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Sale Receipts</h1>
        </div>
        <Link
          href="/sale-receipts/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New receipt
        </Link>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">This month</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(thisMonthCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Total collected</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(totalCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Total receipts</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {receipts.length}
          </p>
        </div>
      </section>
      <SaleReceiptTable receipts={receipts} />
    </main>
  );
}
