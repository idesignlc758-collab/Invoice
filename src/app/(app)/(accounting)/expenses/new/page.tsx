import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ExpenseForm } from "@/components/expense-form";

export default async function NewExpensePage() {
  const user = await getCurrentUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Money out</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">New expense</h1>
        </div>
        <Link href="/expenses" className="text-sm font-medium text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
      <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <ExpenseForm projects={projects} />
      </div>
    </main>
  );
}
