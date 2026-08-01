import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const result = await prisma.bankTransaction.updateMany({
    where: { id, userId: user.id },
    data: { isReconciled: false, matchedExpenseId: null, matchedInvoiceId: null, matchedSaleReceiptId: null },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Bank transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
