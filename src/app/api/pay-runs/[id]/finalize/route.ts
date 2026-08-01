import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

// Finalizing a pay run logs one "Payroll" expense per employee for the
// gross pay -- this is a bookkeeping record, not a payroll tax filing or
// remittance. Actual withholding deposits and filings go through your
// payroll provider or accountant.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const payRun = await prisma.payRun.findFirst({
    where: { id, userId: user.id },
    include: { items: { include: { employee: true } } },
  });
  if (!payRun) {
    return NextResponse.json({ error: "Pay run not found." }, { status: 404 });
  }
  if (payRun.status === "finalized") {
    return NextResponse.json({ error: "This pay run is already finalized." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.payRun.update({ where: { id: payRun.id }, data: { status: "finalized" } }),
    prisma.expense.createMany({
      data: payRun.items.map((item) => ({
        userId: user.id,
        date: payRun.payDate,
        description: `Payroll: ${item.employee.name} (${formatDate(payRun.payPeriodStart)} - ${formatDate(payRun.payPeriodEnd)})`,
        category: "Payroll",
        amount: item.grossPay,
        notes: `Auto-generated when pay run finalized. Net pay: ${(item.netPay / 100).toFixed(2)}.`,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
