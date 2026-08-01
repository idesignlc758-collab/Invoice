import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { emailSaleReceipt } from "@/lib/sale-receipt-email";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const receipt = await prisma.saleReceipt.findFirst({
    where: { id, userId: user.id },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!receipt) {
    return NextResponse.json({ error: "Sale receipt not found." }, { status: 404 });
  }

  const sent = await emailSaleReceipt(user.id, user.email, receipt);
  if (!sent) {
    return NextResponse.json({ error: "Could not send the email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
