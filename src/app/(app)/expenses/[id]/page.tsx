import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseDeleteButton } from "@/components/expense-delete-button";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Scoped to the signed-in user, so an expense ID from elsewhere resolves to
  // a 404 rather than exposing someone else's data.
  const [expense, projects] = await Promise.all([
    prisma.expense.findFirst({ where: { id, userId: user.id } }),
    prisma.project.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!expense) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Money out</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Edit expense</h1>
        </div>
        <Link href="/expenses" className="text-sm font-medium text-muted hover:text-foreground">
          Back
        </Link>
      </div>
      <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <ExpenseForm
          initialExpense={{
            id: expense.id,
            date: expense.date.toISOString().slice(0, 10),
            description: expense.description,
            amount: (expense.amount / 100).toFixed(2),
            category: expense.category,
            vendor: expense.vendor ?? "",
            paymentMethod: expense.paymentMethod ?? "",
            notes: expense.notes ?? "",
            receiptUrl: expense.receiptUrl,
            projectId: expense.projectId ?? "",
          }}
          projects={projects}
        />
      </div>
      <div className="flex justify-end">
        <ExpenseDeleteButton expenseId={expense.id} />
      </div>
    </main>
  );
}
