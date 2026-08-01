import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function PayRunsPage() {
  const user = await getCurrentUser();
  const payRuns = await prisma.payRun.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { payDate: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href="/payroll" className="hover:underline">
              Payroll
            </Link>
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Pay Runs</h1>
        </div>
        <Link
          href="/payroll/pay-runs/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New pay run
        </Link>
      </div>

      {payRuns.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card px-4 py-10 text-center text-sm text-muted">
          No pay runs yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {payRuns.map((payRun) => {
            const total = payRun.items.reduce((sum, item) => sum + item.grossPay, 0);
            return (
              <Link
                key={payRun.id}
                href={`/payroll/pay-runs/${payRun.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4 hover:border-accent/60"
              >
                <div>
                  <p className="font-medium">
                    {formatDate(payRun.payPeriodStart)} – {formatDate(payRun.payPeriodEnd)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {payRun.items.length} employees · Paid {formatDate(payRun.payDate)} ·{" "}
                    {payRun.status === "finalized" ? "Finalized" : "Draft"}
                  </p>
                </div>
                <p className="font-display text-lg font-bold tabular-nums">{formatCents(total)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
