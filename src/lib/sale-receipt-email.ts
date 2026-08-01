import { prisma } from "@/lib/prisma";
import { sendSaleReceiptEmail } from "@/lib/mail";
import { generateSaleReceiptPdf } from "@/lib/sale-receipt-pdf";
import type { SaleReceipt, SaleReceiptLineItem } from "@/generated/prisma/client";

// Shared by the create route (optional "email the customer now" checkbox)
// and the standalone resend route, so the PDF-then-email flow only lives
// in one place.
export async function emailSaleReceipt(
  userId: string,
  userEmail: string,
  receipt: SaleReceipt & { lineItems: SaleReceiptLineItem[] }
) {
  const businessProfile = await prisma.businessProfile.findUnique({ where: { userId } });
  const businessName = businessProfile?.businessName ?? userEmail;

  const pdfBase64 = await generateSaleReceiptPdf({
    receiptNumber: receipt.receiptNumber,
    businessName,
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

  return sendSaleReceiptEmail({
    to: receipt.customerEmail,
    customerName: receipt.customerName,
    businessName,
    receiptNumber: receipt.receiptNumber,
    totalCents: receipt.total,
    currency: receipt.currency,
    pdfBase64,
  });
}
