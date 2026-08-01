import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/lib/expense-constants";

function parseAmountCents(value: unknown) {
  const amount = Math.round(Number(value) * 100);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function parseDate(value: unknown) {
  const date = new Date(String(value ?? ""));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const description = String(body.description ?? "").trim().slice(0, 500);
  const category = String(body.category ?? "");
  const vendor = body.vendor ? String(body.vendor).trim().slice(0, 200) : null;
  const paymentMethod = body.paymentMethod ? String(body.paymentMethod) : null;
  const receiptUrl = body.receiptUrl ? String(body.receiptUrl) : null;
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : null;
  const projectId = body.projectId ? String(body.projectId) : null;
  const amount = parseAmountCents(body.amount);
  const date = parseDate(body.date);

  if (!description || !amount || !date) {
    return NextResponse.json(
      { error: "Enter a description, a valid amount, and a date." },
      { status: 400 }
    );
  }
  if (!EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }
  if (paymentMethod && !EXPENSE_PAYMENT_METHODS.includes(paymentMethod as (typeof EXPENSE_PAYMENT_METHODS)[number])) {
    return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  }
  if (projectId) {
    const owned = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      date,
      description,
      category,
      vendor,
      amount,
      paymentMethod,
      receiptUrl,
      notes,
      projectId,
    },
  });

  return NextResponse.json({ expense });
}
