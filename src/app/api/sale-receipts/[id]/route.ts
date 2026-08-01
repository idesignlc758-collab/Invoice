import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// Sale receipts are financial records, not drafts -- like invoices, once
// created their line items and totals aren't editable. The one supported
// transition is voiding, which preserves the record instead of deleting it.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await request.json();

  if (body.status !== "void") {
    return NextResponse.json({ error: "The only supported update is voiding a receipt." }, { status: 400 });
  }

  const result = await prisma.saleReceipt.updateMany({
    where: { id, userId: user.id },
    data: { status: "void" },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Sale receipt not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
