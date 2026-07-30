import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { parseLineItems, summarizeItems } from "@/lib/line-items";
import { sendBrandedEstimateEmail } from "@/lib/mail";

function formatAddress(profile: {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}) {
  return [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
    profile.country,
  ]
    .filter(Boolean)
    .join(" - ");
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();
  const clientEmail = String(body.clientEmail ?? "").trim();
  const normalizedClientEmail = clientEmail.toLowerCase();
  const clientName = body.clientName ? String(body.clientName).trim() : null;
  const clientNote = String(body.clientNote ?? "").trim().slice(0, 1000) || null;
  const privateMemo = String(body.privateMemo ?? "").trim().slice(0, 1000) || null;
  const clientTerms = String(body.clientTerms ?? "").trim().slice(0, 4000) || null;
  const items = parseLineItems(body.items);
  const currency = "usd";

  const requestedTax = Number(body.taxPercent);
  const taxPercent = Number.isFinite(requestedTax)
    ? Math.min(100, Math.max(0, requestedTax))
    : 0;

  const requestedExpiryDays = Number(body.expiresInDays);
  const expiresInDays = Number.isFinite(requestedExpiryDays)
    ? Math.min(365, Math.max(1, Math.round(requestedExpiryDays)))
    : 30;

  if (!clientEmail || items.length === 0) {
    return NextResponse.json(
      { error: "Enter a client email and at least one line item with an amount." },
      { status: 400 }
    );
  }

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountCents,
    0
  );
  const taxableSubtotalCents = items.reduce(
    (sum, item) => sum + (item.taxable ? item.quantity * item.unitAmountCents : 0),
    0
  );
  const taxAmountCents = Math.round(taxableSubtotalCents * (taxPercent / 100));
  const totalCents = subtotalCents + taxAmountCents;
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const savedProducts = await prisma.product.findMany({
    where: {
      userId: user.id,
      id: { in: items.map((item) => item.productId).filter((id): id is string => Boolean(id)) },
    },
  });
  const productById = new Map(savedProducts.map((product) => [product.id, product]));
  const resolvedItems = await Promise.all(
    items.map(async (item) => {
      const existing = item.productId ? productById.get(item.productId) : null;
      if (existing) return { ...item, product: existing };
      if (!item.saveProduct) return { ...item, product: null };

      const product = await prisma.product.upsert({
        where: { userId_name: { userId: user.id, name: item.description } },
        update: {
          unitAmount: item.unitAmountCents,
          currency,
          type: item.productType,
          taxable: item.taxable,
          active: true,
        },
        create: {
          userId: user.id,
          name: item.description,
          unitAmount: item.unitAmountCents,
          currency,
          type: item.productType,
          taxable: item.taxable,
        },
      });

      return { ...item, product };
    })
  );

  const client = await prisma.client.upsert({
    where: { userId_email: { userId: user.id, email: normalizedClientEmail } },
    update: { name: clientName },
    create: {
      userId: user.id,
      email: normalizedClientEmail,
      name: clientName,
    },
  });

  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
  const brandBusinessName = profile?.businessName ?? user.email.split("@")[0];
  const providerAddress = profile ? formatAddress(profile) : "";
  const brandFooter =
    profile?.invoiceFooter ??
    `Estimate prepared by ${brandBusinessName}. Payment will be processed securely after invoice approval.`;

  const estimate = await prisma.estimate.create({
    data: {
      userId: user.id,
      clientId: client.id,
      clientEmail,
      clientName,
      description: summarizeItems(items),
      subtotal: subtotalCents,
      taxPercent,
      taxAmount: taxAmountCents,
      amount: totalCents,
      currency,
      status: "sent",
      brandBusinessName,
      brandLogoUrl: profile?.logoUrl ?? null,
      brandColor: profile?.brandColor ?? "#c81010",
      brandSupportEmail: profile?.supportEmail ?? user.email,
      brandAddressLine1: profile?.addressLine1 ?? null,
      brandAddressLine2: profile?.addressLine2 ?? null,
      brandCity: profile?.city ?? null,
      brandState: profile?.state ?? null,
      brandPostalCode: profile?.postalCode ?? null,
      brandCountry: profile?.country ?? null,
      brandFooter,
      clientTerms,
      clientNote,
      privateMemo,
      expiresAt,
      sentAt: new Date(),
      lineItems: {
        create: resolvedItems.map((item, index) => ({
          productId: item.product?.id,
          description: item.description,
          productName: item.product?.name ?? item.description,
          productType: item.product?.type ?? item.productType,
          taxable: item.taxable,
          quantity: item.quantity,
          unitAmount: item.unitAmountCents,
          amount: item.quantity * item.unitAmountCents,
          position: index,
        })),
      },
    },
  });

  await prisma.product.updateMany({
    where: {
      id: {
        in: resolvedItems
          .map((item) => item.product?.id)
          .filter((id): id is string => Boolean(id)),
      },
      userId: user.id,
    },
    data: { timesUsed: { increment: 1 } },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const publicEstimateUrl = `${appUrl}/e/${estimate.publicToken}`;
  const brandedEmailSent = await sendBrandedEstimateEmail({
    to: clientEmail,
    clientName,
    businessName: brandBusinessName,
    estimateDescription: estimate.description,
    totalCents,
    currency,
    publicEstimateUrl,
    supportEmail: profile?.supportEmail ?? user.email,
    footer: providerAddress ? `${brandFooter}\n${providerAddress}` : brandFooter,
    clientNote,
    expiresAt,
  });

  return NextResponse.json({
    ok: true,
    estimateId: estimate.id,
    publicEstimateUrl,
    brandedEmailSent,
  });
}
