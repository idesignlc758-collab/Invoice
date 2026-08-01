import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { generateSaleReceiptPdf } from "@/lib/sale-receipt-pdf";

export async function GET(
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

  const businessProfile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
  const pdfBase64 = await generateSaleReceiptPdf({
    receiptNumber: receipt.receiptNumber,
    businessName: businessProfile?.businessName ?? user.email,
    customerName: receipt.customerName,
    customerEmail: receipt.customerEmail,
    saleDate: receipt.saleDate,
    items: receipt.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      amount: item.amount,
    })),
    subtotal: receipt.subtotal,
    taxPercent: receipt.taxPercent,
    taxAmount: receipt.taxAmount,
    total: receipt.total,
    currency: receipt.currency,
    paymentMethod: receipt.paymentMethod,
    paymentReference: receipt.paymentReference,
    notes: receipt.notes,
  });

  return new NextResponse(Buffer.from(pdfBase64, "base64"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Receipt-${receipt.receiptNumber}.pdf"`,
    },
  });
}
