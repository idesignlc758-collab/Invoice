import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { ArchiveToggle } from "@/components/archive-toggle";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
    include: {
      client: true,
      invoices: { orderBy: { createdAt: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });
  if (!project) notFound();

  const incomeCents = project.invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingCents = project.invoices
    .filter((invoice) => invoice.status === "open")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const costCents = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profitCents = incomeCents - costCents;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <Link href="/projects" className="self-start text-sm text-muted">
        ← Projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{project.client?.name ?? project.client?.email ?? "No client"}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{project.name}</h1>
          {!project.isActive && <p className="mt-1 text-sm text-muted">Archived</p>}
        </div>
        <ArchiveToggle
          endpoint={`/api/projects/${project.id}`}
          isActive={project.isActive}
          label="project"
          redirectTo="/projects"
        />
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Income (paid)</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{formatCents(incomeCents)}</p>
          {pendingCents > 0 && (
            <p className="mt-1 text-xs text-muted">+ {formatCents(pendingCents)} pending</p>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Costs</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">{formatCents(costCents)}</p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Profit</p>
          <p
            className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${
              profitCents >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatCents(profitCents)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h2 className="mb-3 font-display text-xl font-bold">Invoices</h2>
        {project.invoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No invoices tagged to this project.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {project.invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-background p-3 text-sm hover:bg-line/30"
              >
                <span className="min-w-0 truncate">
                  {invoice.description} · {formatDate(invoice.createdAt)}
                </span>
                <span className="shrink-0 tabular-nums">{formatCents(invoice.amount)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <h2 className="mb-3 font-display text-xl font-bold">Expenses</h2>
        {project.expenses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No expenses tagged to this project.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {project.expenses.map((expense) => (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center justify-between gap-4 rounded-xl bg-background p-3 text-sm hover:bg-line/30"
              >
                <span className="min-w-0 truncate">
                  {expense.description} · {formatDate(expense.date)}
                </span>
                <span className="shrink-0 tabular-nums">{formatCents(expense.amount)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
