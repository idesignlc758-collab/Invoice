import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

export default async function BudgetsPage() {
  const user = await getCurrentUser();
  const budgets = await prisma.budget.findMany({
    where: { userId: user.id },
    include: { lines: true },
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Plan spending by category</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Budgets</h1>
        </div>
        <Link
          href="/budgets/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New budget
        </Link>
      </div>

      {budgets.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-10 text-center text-sm text-muted">
          No budgets yet. Create one to plan spending against your expense categories.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const annualTotal = budget.lines.reduce((sum, line) => {
              const amounts = JSON.parse(line.amounts) as number[];
              return sum + amounts.reduce((s, a) => s + a, 0);
            }, 0);
            return (
              <Link
                key={budget.id}
                href={`/budgets/${budget.id}`}
                className="rounded-2xl border border-line bg-card p-5 hover:border-accent/60"
              >
                <p className="text-xs uppercase tracking-wide text-muted">{budget.year}</p>
                <p className="mt-1 font-display text-lg font-bold">{budget.name}</p>
                <p className="mt-2 text-sm text-muted">
                  {budget.lines.length} categories · {formatCents(annualTotal)}/year
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
