import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { ACCOUNTING_NAV_GROUPS } from "@/lib/accounting-navigation";

// Overview landing, ported from Connect's AccountingOverviewDashboard:
// a "needs attention" row driven by real data, then a grid of the work
// areas defined in ACCOUNTING_NAV_GROUPS.
export default async function AccountingOverviewPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [overdueInvoices, unreconciledCount, lowStockItems, monthExpenses, paidThisMonth, receiptsThisMonth] =
    await Promise.all([
      prisma.invoice.findMany({
        where: { userId: user.id, status: "open", dueDate: { lt: now } },
        select: { amount: true },
      }),
      prisma.bankTransaction.count({ where: { userId: user.id, isReconciled: false } }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM "InventoryItem"
        WHERE "userId" = ${user.id} AND "quantityOnHand" <= "reorderPoint"
      `,
      prisma.expense.aggregate({
        where: { userId: user.id, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { userId: user.id, status: "paid", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.saleReceipt.aggregate({
        where: { userId: user.id, status: "completed", saleDate: { gte: startOfMonth } },
        _sum: { total: true },
      }),
    ]);

  const overdueCents = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
  const lowStockCount = Number(lowStockItems[0]?.count ?? 0);
  const incomeCents = (paidThisMonth._sum.amount ?? 0) + (receiptsThisMonth._sum.total ?? 0);
  const expenseCents = monthExpenses._sum.amount ?? 0;

  const attention = [
    overdueInvoices.length > 0 && {
      title: "Overdue invoices",
      value: formatCents(overdueCents),
      action: `${overdueInvoices.length} past due — follow up`,
      href: "/invoices",
    },
    unreconciledCount > 0 && {
      title: "Unreconciled transactions",
      value: String(unreconciledCount),
      action: "Match them to expenses or income",
      href: "/banking",
    },
    lowStockCount > 0 && {
      title: "Low stock",
      value: String(lowStockCount),
      action: "At or below reorder point",
      href: "/inventory",
    },
  ].filter(Boolean) as { title: string; value: string; action: string; href: string }[];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Accounting</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Overview</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Everything beyond invoicing — spend, books, banking, payroll, and reporting.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Income this month</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(incomeCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Expenses this month</p>
          <p className="mt-2 font-display text-2xl font-extrabold tabular-nums">
            {formatCents(expenseCents)}
          </p>
        </div>
        <div className="rounded-3xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Net</p>
          <p
            className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${
              incomeCents - expenseCents >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatCents(incomeCents - expenseCents)}
          </p>
        </div>
      </section>

      {attention.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="needs-attention">
          <h2 id="needs-attention" className="text-sm font-semibold">
            Needs attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {attention.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-2xl border border-danger/20 bg-danger-soft p-4 transition-colors hover:border-danger/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block font-display text-lg font-bold tabular-nums text-danger">
                      {item.value}
                    </span>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-danger transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                <span className="mt-2 block text-xs font-medium text-danger">{item.action}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="work-areas">
        <h2 id="work-areas" className="text-sm font-semibold">
          Work areas
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ACCOUNTING_NAV_GROUPS.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.id} className="rounded-2xl border border-line bg-card p-5">
                <Link href={group.path} className="group flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-display text-base font-bold">
                      {group.label}
                      <ArrowRight
                        className="h-3.5 w-3.5 text-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                      {group.description}
                    </span>
                  </span>
                </Link>
                {group.items.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.path}
                        className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
