import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { PayRunForm } from "@/components/pay-run-form";

export default async function NewPayRunPage() {
  const user = await getCurrentUser();
  const employees = await prisma.employee.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Payroll</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">New pay run</h1>
        </div>
        <Link href="/payroll/pay-runs" className="text-sm font-medium text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
      {employees.length === 0 ? (
        <p className="rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
          Add an{" "}
          <Link href="/payroll" className="text-accent underline">
            employee
          </Link>{" "}
          before running payroll.
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <PayRunForm employees={employees} />
        </div>
      )}
    </main>
  );
}
