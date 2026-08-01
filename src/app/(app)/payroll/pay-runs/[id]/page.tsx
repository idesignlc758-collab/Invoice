import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { PayRunFinalizeButton } from "@/components/pay-run-finalize-button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default async function PayRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const payRun = await prisma.payRun.findFirst({
    where: { id, userId: user.id },
    include: { items: { include: { employee: true } } },
  });
  if (!payRun) notFound();

  const totalGross = payRun.items.reduce((sum, item) => sum + item.grossPay, 0);
  const totalNet = payRun.items.reduce((sum, item) => sum + item.netPay, 0);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <Link href="/payroll/pay-runs" className="self-start text-sm text-muted">
        ← Pay Runs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {formatDate(payRun.payPeriodStart)} – {formatDate(payRun.payPeriodEnd)}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Pay date {formatDate(payRun.payDate)}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {payRun.status === "finalized" ? "Finalized — logged to Expenses" : "Draft"}
          </p>
        </div>
        {payRun.status !== "finalized" && <PayRunFinalizeButton payRunId={payRun.id} />}
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 font-medium">Employee</th>
                <th className="py-2 text-right font-medium">Gross</th>
                <th className="py-2 text-right font-medium">Deductions</th>
                <th className="py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {payRun.items.map((item) => {
                const deductions = item.federalTax + item.stateTax + item.socialSecurity + item.medicare + item.otherDeductions;
                return (
                  <tr key={item.id} className="border-b border-line last:border-0">
                    <td className="py-2">{item.employee.name}</td>
                    <td className="py-2 text-right tabular-nums">{formatCents(item.grossPay)}</td>
                    <td className="py-2 text-right tabular-nums">{formatCents(deductions)}</td>
                    <td className="py-2 text-right font-medium tabular-nums">{formatCents(item.netPay)}</td>
                  </tr>
                );
              })}
              <tr className="font-bold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right tabular-nums">{formatCents(totalGross)}</td>
                <td className="py-2 text-right tabular-nums">{formatCents(totalGross - totalNet)}</td>
                <td className="py-2 text-right tabular-nums">{formatCents(totalNet)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
