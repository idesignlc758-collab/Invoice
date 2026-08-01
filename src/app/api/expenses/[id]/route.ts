import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/lib/expense-constants";

function parseAmountCents(value: unknown) {
  const amount = Math.round(Number(value) * 100);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function parseDate(value: unknown) {
  if (value === undefined) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await request.json();

  if (body.category !== undefined && !EXPENSE_CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
  }
  if (
    body.paymentMethod !== undefined &&
    body.paymentMethod !== null &&
    !EXPENSE_PAYMENT_METHODS.includes(body.paymentMethod)
  ) {
    return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  }

  const result = await prisma.expense.updateMany({
    where: { id, userId: user.id },
    data: {
      date: parseDate(body.date),
      description: body.description === undefined ? undefined : String(body.description).trim().slice(0, 500),
      category: body.category === undefined ? undefined : String(body.category),
      vendor: body.vendor === undefined ? undefined : (body.vendor ? String(body.vendor).trim().slice(0, 200) : null),
      amount: body.amount === undefined ? undefined : parseAmountCents(body.amount),
      paymentMethod: body.paymentMethod === undefined ? undefined : body.paymentMethod,
      receiptUrl: body.receiptUrl === undefined ? undefined : body.receiptUrl,
      notes: body.notes === undefined ? undefined : (body.notes ? String(body.notes).trim().slice(0, 2000) : null),
      projectId: body.projectId === undefined ? undefined : (body.projectId || null),
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const result = await prisma.expense.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Expense not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
