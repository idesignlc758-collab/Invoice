import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EmployeeManager } from "@/components/employee-manager";

export default async function PayrollPage() {
  const user = await getCurrentUser();
  const employees = await prisma.employee.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Employee records</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Payroll</h1>
        </div>
        <Link
          href="/payroll/pay-runs"
          className="min-h-11 rounded-2xl border border-line px-4 py-3 text-sm font-bold"
        >
          Pay runs →
        </Link>
      </div>
      <p className="rounded-2xl bg-line px-4 py-3 text-sm text-muted">
        This is a record-keeping tool only. It does not calculate, withhold, deposit, or file
        payroll taxes — enter withholding amounts from your actual payroll provider or
        accountant. For real payroll tax compliance, use a licensed payroll service (Gusto, ADP,
        Rippling, QuickBooks Payroll, etc.).
      </p>
      <EmployeeManager employees={employees} />
    </main>
  );
}
