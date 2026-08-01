import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { emailSaleReceipt } from "@/lib/sale-receipt-email";

type IncomingItem = { description: string; quantity: number; unitAmountCents: number };

function parseItems(raw: unknown): IncomingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      return {
        description: String(item.description ?? "").trim(),
        quantity: Math.round(Number(item.quantity)),
        unitAmountCents: Math.round(Number(item.unitAmountCents)),
      };
    })
    .filter(
      (item) =>
        item.description.length > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitAmountCents) &&
        item.unitAmountCents > 0
    );
}

async function nextReceiptNumber(userId: string) {
  const count = await prisma.saleReceipt.count({ where: { userId } });
  return `SR-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const customerName = String(body.customerName ?? "").trim();
  const customerEmail = String(body.customerEmail ?? "").trim().toLowerCase();
  const customerAddress = body.customerAddress ? String(body.customerAddress).trim() : null;
  const saleDate = new Date(String(body.saleDate ?? ""));
  const paymentMethod = body.paymentMethod ? String(body.paymentMethod) : null;
  const paymentReference = body.paymentReference ? String(body.paymentReference).trim() : null;
  const notes = body.notes ? String(body.notes).trim().slice(0, 2000) : null;
  const sendEmail = Boolean(body.sendEmail);
  const items = parseItems(body.items);

  const requestedTax = Number(body.taxPercent);
  const taxPercent = Number.isFinite(requestedTax) ? Math.min(100, Math.max(0, requestedTax)) : 0;

  if (!customerName || !customerEmail || items.length === 0 || Number.isNaN(saleDate.getTime())) {
    return NextResponse.json(
      { error: "Enter a customer name, email, sale date, and at least one item." },
      { status: 400 }
    );
  }

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.unitAmountCents, 0);
  const taxAmountCents = Math.round(subtotalCents * (taxPercent / 100));
  const totalCents = subtotalCents + taxAmountCents;

  const client = await prisma.client.upsert({
    where: { userId_email: { userId: user.id, email: customerEmail } },
    update: { name: customerName },
    create: { userId: user.id, email: customerEmail, name: customerName },
  });

  const receiptNumber = await nextReceiptNumber(user.id);

  const receipt = await prisma.saleReceipt.create({
    data: {
      userId: user.id,
      clientId: client.id,
      receiptNumber,
      customerName,
      customerEmail,
      customerAddress,
      saleDate,
      subtotal: subtotalCents,
      taxPercent,
      taxAmount: taxAmountCents,
      total: totalCents,
      paymentMethod,
      paymentReference,
      notes,
      lineItems: {
        create: items.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitAmount: item.unitAmountCents,
          amount: item.quantity * item.unitAmountCents,
          position: index,
        })),
      },
    },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  let emailSent = false;
  if (sendEmail) {
    try {
      emailSent = await emailSaleReceipt(user.id, user.email, receipt);
    } catch (error) {
      console.error("Failed to email sale receipt", error);
    }
  }

  return NextResponse.json({ receipt, emailSent });
}
