import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type IncomingItem = {
  employeeId: string;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  otherDeductions: number;
};

function parseItems(raw: unknown): IncomingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const toCents = (v: unknown) => Math.round((Number(v) || 0) * 100);
      return {
        employeeId: String(item.employeeId ?? ""),
        grossPay: toCents(item.grossPay),
        federalTax: toCents(item.federalTax),
        stateTax: toCents(item.stateTax),
        socialSecurity: toCents(item.socialSecurity),
        medicare: toCents(item.medicare),
        otherDeductions: toCents(item.otherDeductions),
      };
    })
    .filter((item) => item.employeeId && item.grossPay > 0);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const payPeriodStart = new Date(String(body.payPeriodStart ?? ""));
  const payPeriodEnd = new Date(String(body.payPeriodEnd ?? ""));
  const payDate = new Date(String(body.payDate ?? ""));
  const items = parseItems(body.items);

  if ([payPeriodStart, payPeriodEnd, payDate].some((d) => Number.isNaN(d.getTime()))) {
    return NextResponse.json({ error: "Enter a valid pay period and pay date." }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Add at least one employee with gross pay." }, { status: 400 });
  }

  const employeeIds = [...new Set(items.map((i) => i.employeeId))];
  const ownedCount = await prisma.employee.count({ where: { id: { in: employeeIds }, userId: user.id } });
  if (ownedCount !== employeeIds.length) {
    return NextResponse.json({ error: "One or more employees are invalid." }, { status: 400 });
  }

  const payRun = await prisma.payRun.create({
    data: {
      userId: user.id,
      payPeriodStart,
      payPeriodEnd,
      payDate,
      items: {
        create: items.map((item) => ({
          employeeId: item.employeeId,
          grossPay: item.grossPay,
          federalTax: item.federalTax,
          stateTax: item.stateTax,
          socialSecurity: item.socialSecurity,
          medicare: item.medicare,
          otherDeductions: item.otherDeductions,
          netPay:
            item.grossPay -
            item.federalTax -
            item.stateTax -
            item.socialSecurity -
            item.medicare -
            item.otherDeductions,
        })),
      },
    },
    include: { items: { include: { employee: true } } },
  });

  return NextResponse.json({ payRun });
}
