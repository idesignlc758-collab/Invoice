import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { PAY_TYPES } from "@/lib/payroll-constants";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const name = String(body.name ?? "").trim().slice(0, 200);
  const email = body.email ? String(body.email).trim().slice(0, 200) : null;
  const role = body.role ? String(body.role).trim().slice(0, 200) : null;
  const payType = String(body.payType ?? "");
  const payRate = Math.round(Number(body.payRate) * 100);
  const startDate = new Date(String(body.startDate ?? ""));

  if (!name) {
    return NextResponse.json({ error: "Enter an employee name." }, { status: 400 });
  }
  if (!PAY_TYPES.includes(payType as (typeof PAY_TYPES)[number])) {
    return NextResponse.json({ error: "Choose salary or hourly." }, { status: 400 });
  }
  if (!Number.isFinite(payRate) || payRate <= 0) {
    return NextResponse.json({ error: "Enter a valid pay rate." }, { status: 400 });
  }
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Enter a valid start date." }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: { userId: user.id, name, email, role, payType, payRate, startDate },
  });

  return NextResponse.json({ employee });
}
