import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { BudgetDeleteButton } from "@/components/budget-delete-button";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const budget = await prisma.budget.findFirst({
    where: { id, userId: user.id },
    include: { lines: true },
  });
  if (!budget) notFound();

  const yearStart = new Date(budget.year, 0, 1);
  const yearEnd = new Date(budget.year + 1, 0, 1);
  const now = new Date();
  const isCurrentYear = now.getFullYear() === budget.year;
  // For a past year, compare against the full year; for the current year,
  // compare against year-to-date so the bar isn't misleadingly "under
  // budget" just because most of the year hasn't happened yet.
  const actualEnd = isCurrentYear ? now : yearEnd;

  const rows = await Promise.all(
    budget.lines.map(async (line) => {
      const amounts = JSON.parse(line.amounts) as number[];
      const annualBudget = amounts.reduce((sum, a) => sum + a, 0);
      const actual = await prisma.expense.aggregate({
        where: { userId: user.id, category: line.category, date: { gte: yearStart, lt: actualEnd } },
        _sum: { amount: true },
      });
      const actualCents = actual._sum.amount ?? 0;
      return { category: line.category, annualBudget, actualCents };
    })
  );

  const totalBudget = rows.reduce((sum, row) => sum + row.annualBudget, 0);
  const totalActual = rows.reduce((sum, row) => sum + row.actualCents, 0);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <Link href="/budgets" className="self-start text-sm text-muted">
        ← Budgets
      </Link>

      <div>
        <p className="text-sm text-muted">{budget.year}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{budget.name}</h1>
        {isCurrentYear && (
          <p className="mt-1 text-sm text-muted">Actuals shown year-to-date.</p>
        )}
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Annual budget</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(totalBudget)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Actual{isCurrentYear ? " (YTD)" : ""}</p>
          <p
            className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${
              totalActual > totalBudget ? "text-danger" : "text-success"
            }`}
          >
            {formatCents(totalActual)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h2 className="mb-4 font-display text-xl font-bold">By category</h2>
        <div className="flex flex-col gap-4">
          {rows.map((row) => {
            const percent = row.annualBudget > 0 ? Math.round((row.actualCents / row.annualBudget) * 100) : 0;
            const overBudget = row.actualCents > row.annualBudget;
            return (
              <div key={row.category}>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium">{row.category}</span>
                  <span className="tabular-nums text-muted">
                    {formatCents(row.actualCents)} / {formatCents(row.annualBudget)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full rounded-full ${overBudget ? "bg-danger" : "bg-accent"}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex justify-end">
        <BudgetDeleteButton budgetId={budget.id} />
      </div>
    </main>
  );
}
