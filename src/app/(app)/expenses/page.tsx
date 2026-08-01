import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ExpenseTable } from "@/components/expense-table";
import { formatCents } from "@/lib/format";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export default async function ExpensesPage() {
  const user = await getCurrentUser();
  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  const monthStart = startOfMonth(new Date());
  const thisMonthCents = expenses
    .filter((expense) => expense.date >= monthStart)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalCents = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Money out</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Expenses</h1>
        </div>
        <Link
          href="/expenses/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New expense
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
          <p className="text-sm text-muted">Total logged</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(totalCents)}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Total expenses</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {expenses.length}
          </p>
        </div>
      </section>
      <ExpenseTable expenses={expenses} />
    </main>
  );
}
