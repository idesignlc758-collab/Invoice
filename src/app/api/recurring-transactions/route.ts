import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/expense-constants";
import { RECURRING_FREQUENCIES } from "@/lib/recurrence";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const templateName = String(body.templateName ?? "").trim().slice(0, 200);
  const description = String(body.description ?? "").trim().slice(0, 500);
  const category = String(body.category ?? "");
  const vendor = body.vendor ? String(body.vendor).trim().slice(0, 200) : null;
  const amount = Math.round(Number(body.amount) * 100);
  const frequency = String(body.frequency ?? "");
  const startDate = new Date(String(body.startDate ?? ""));

  if (!templateName || !description) {
    return NextResponse.json({ error: "Enter a template name and description." }, { status: 400 });
  }
  if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
  }
  if (!RECURRING_FREQUENCIES.includes(frequency as (typeof RECURRING_FREQUENCIES)[number])) {
    return NextResponse.json({ error: "Choose a valid frequency." }, { status: 400 });
  }
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Enter a valid start date." }, { status: 400 });
  }

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      templateName,
      description,
      category,
      vendor,
      amount,
      frequency,
      startDate,
      nextOccurrence: startDate,
    },
  });

  return NextResponse.json({ recurring });
}
