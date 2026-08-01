import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const MATCH_TYPES = ["expense", "invoice", "saleReceipt"] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await request.json();

  const type = String(body.type ?? "");
  const recordId = String(body.recordId ?? "");
  if (!MATCH_TYPES.includes(type as (typeof MATCH_TYPES)[number]) || !recordId) {
    return NextResponse.json({ error: "Choose a record to match." }, { status: 400 });
  }

  const transaction = await prisma.bankTransaction.findFirst({ where: { id, userId: user.id } });
  if (!transaction) {
    return NextResponse.json({ error: "Bank transaction not found." }, { status: 404 });
  }

  if (type === "expense") {
    const owned = await prisma.expense.findFirst({ where: { id: recordId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    await prisma.bankTransaction.update({
      where: { id },
      data: { isReconciled: true, matchedExpenseId: recordId, matchedInvoiceId: null, matchedSaleReceiptId: null },
    });
  } else if (type === "invoice") {
    const owned = await prisma.invoice.findFirst({ where: { id: recordId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    await prisma.bankTransaction.update({
      where: { id },
      data: { isReconciled: true, matchedInvoiceId: recordId, matchedExpenseId: null, matchedSaleReceiptId: null },
    });
  } else {
    const owned = await prisma.saleReceipt.findFirst({ where: { id: recordId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Sale receipt not found." }, { status: 404 });
    await prisma.bankTransaction.update({
      where: { id },
      data: { isReconciled: true, matchedSaleReceiptId: recordId, matchedExpenseId: null, matchedInvoiceId: null },
    });
  }

  return NextResponse.json({ ok: true });
}
