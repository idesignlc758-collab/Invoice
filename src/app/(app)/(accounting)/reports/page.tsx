import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

const RANGE_PRESETS = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
  { key: "all_time", label: "All time" },
] as const;

type RangeKey = (typeof RANGE_PRESETS)[number]["key"];

function resolveRange(key: RangeKey): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (key) {
    case "this_month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
    case "last_month":
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 1),
      };
    case "this_year":
      return { start: new Date(now.getFullYear(), 0, 1), end: null };
    case "all_time":
      return { start: null, end: null };
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const activeRange: RangeKey = RANGE_PRESETS.some((preset) => preset.key === range)
    ? (range as RangeKey)
    : "this_month";
  const { start, end } = resolveRange(activeRange);

  const user = await getCurrentUser();

  // Income is paid invoices PLUS completed sale receipts -- receipts exist
  // precisely to record money collected outside Stripe, so leaving them out
  // would under-report everything this page is meant to answer.
  const [paidInvoices, saleReceipts, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: "paid",
        ...(start || end
          ? { paidAt: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } }
          : {}),
      },
      select: { amount: true },
    }),
    prisma.saleReceipt.findMany({
      where: {
        userId: user.id,
        status: "completed",
        ...(start || end
          ? { saleDate: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } }
          : {}),
      },
      select: { total: true },
    }),
    prisma.expense.findMany({
      where: {
        userId: user.id,
        ...(start || end
          ? { date: { ...(start ? { gte: start } : {}), ...(end ? { lt: end } : {}) } }
          : {}),
      },
      select: { amount: true, category: true },
    }),
  ]);

  const invoiceIncomeCents = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const receiptIncomeCents = saleReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const incomeCents = invoiceIncomeCents + receiptIncomeCents;
  const expenseCents = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netCents = incomeCents - expenseCents;

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amount);
  }
  const categoryBreakdown = Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Income vs. expenses</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted">
          A simple summary of money in and out — not a formal profit &amp; loss or cash-flow
          statement.
        </p>
      </div>

      <div className="flex gap-1 self-start rounded-full border border-line p-1">
        {RANGE_PRESETS.map((preset) => (
          <Link
            key={preset.key}
            href={`/reports?range=${preset.key}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              activeRange === preset.key ? "bg-accent text-accent-contrast" : "text-muted"
            }`}
          >
            {preset.label}
          </Link>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Income</p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">
            {formatCents(incomeCents)}
          </p>
          {receiptIncomeCents > 0 && (
            <p className="mt-1 text-xs text-muted">
              {formatCents(invoiceIncomeCents)} invoices + {formatCents(receiptIncomeCents)} receipts
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Expenses</p>
          <p className="mt-2 font-display text-3xl font-extrabold tabular-nums">
            {formatCents(expenseCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Net</p>
          <p
            className={`mt-2 font-display text-3xl font-extrabold tabular-nums ${
              netCents >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatCents(netCents)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h2 className="mb-4 font-display text-xl font-bold">Expenses by category</h2>
        {categoryBreakdown.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No expenses logged for this range.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {categoryBreakdown.map(({ category, amount }) => {
              const percent = expenseCents > 0 ? Math.round((amount / expenseCents) * 100) : 0;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="tabular-nums text-muted">{formatCents(amount)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
