import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe, calculateFeeAmount } from "@/lib/stripe";
import { formatCents } from "@/lib/format";
import { sendBrandedInvoiceEmail } from "@/lib/mail";

type IncomingItem = {
  description: string;
  quantity: number;
  unitAmountCents: number;
  productId?: string | null;
  saveProduct: boolean;
  productType: string;
  taxable: boolean;
};

function parseItems(raw: unknown): IncomingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const description = String(item.description ?? "").trim();
      const quantity = Math.round(Number(item.quantity));
      const unitAmountCents = Math.round(Number(item.unitAmountCents));
      const productId = item.productId ? String(item.productId) : null;
      const productType = String(item.productType ?? "service").trim() || "service";
      const taxable = item.taxable === undefined ? true : Boolean(item.taxable);

      return {
        description,
        quantity,
        unitAmountCents,
        productId,
        productType,
        taxable,
        saveProduct: Boolean(item.saveProduct),
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

async function resolveTaxRateId(percentage: number): Promise<string> {
  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const match = existing.data.find(
    (rate) => rate.percentage === percentage && rate.inclusive === false
  );
  if (match) return match.id;

  const created = await stripe.taxRates.create({
    display_name: "Tax",
    percentage,
    inclusive: false,
  });
  return created.id;
}

async function ensureStripeProduct(params: {
  name: string;
  description?: string | null;
  unitAmount: number;
  currency: string;
  userId: string;
}) {
  const stripeProduct = await stripe.products.create({
    name: params.name,
    description: params.description ?? undefined,
    metadata: { userId: params.userId },
  });
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: params.unitAmount,
    currency: params.currency,
    metadata: { userId: params.userId },
  });

  return { stripeProductId: stripeProduct.id, stripePriceId: stripePrice.id };
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user.onboardingStatus !== "ready" || !user.stripeAccountId) {
    return NextResponse.json(
      { error: "Connect your Stripe account before sending invoices." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const clientEmail = String(body.clientEmail ?? "").trim();
  const normalizedClientEmail = clientEmail.toLowerCase();
  const clientName = body.clientName ? String(body.clientName).trim() : null;
  const items = parseItems(body.items);
  const deliveryMode = body.deliveryMode === "stripe_email" ? "stripe_email" : "branded_email";

  const requestedTax = Number(body.taxPercent);
  const taxPercent = Number.isFinite(requestedTax)
    ? Math.min(100, Math.max(0, requestedTax))
    : 0;

  const requestedDays = Number(body.dueInDays);
  const dueInDays = Number.isFinite(requestedDays)
    ? Math.min(365, Math.max(0, Math.round(requestedDays)))
    : 0;

  if (!clientEmail || items.length === 0) {
    return NextResponse.json(
      { error: "Enter a client email and at least one line item with an amount." },
      { status: 400 }
    );
  }

  const currency = "usd";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountCents,
    0
  );
  const taxAmountCents = Math.round(subtotalCents * (taxPercent / 100));
  const feeCents = calculateFeeAmount(subtotalCents);
  const acct = user.stripeAccountId;

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

      let stripeCatalog:
        | { stripeProductId: string; stripePriceId: string }
        | { stripeProductId: null; stripePriceId: null } = {
        stripeProductId: null,
        stripePriceId: null,
      };

      try {
        stripeCatalog = await ensureStripeProduct({
          name: item.description,
          unitAmount: item.unitAmountCents,
          currency,
          userId: user.id,
        });
      } catch {
        // The local catalog keeps invoice creation fast even if Stripe catalog
        // sync is temporarily unavailable.
      }

      const product = await prisma.product.upsert({
        where: { userId_name: { userId: user.id, name: item.description } },
        update: {
          unitAmount: item.unitAmountCents,
          currency,
          type: item.productType,
          taxable: item.taxable,
          active: true,
          ...stripeCatalog,
        },
        create: {
          userId: user.id,
          name: item.description,
          unitAmount: item.unitAmountCents,
          currency,
          type: item.productType,
          taxable: item.taxable,
          ...stripeCatalog,
        },
      });

      return { ...item, product };
    })
  );

  let businessName: string | null = null;
  try {
    const account = await stripe.accounts.retrieve(acct);
    businessName =
      account.business_profile?.name ??
      account.settings?.dashboard?.display_name ??
      null;
  } catch {
    // Non-fatal. The app profile can still brand the invoice page and email.
  }

  const localClient = await prisma.client.findUnique({
    where: { userId_email: { userId: user.id, email: normalizedClientEmail } },
  });
  let customerId: string | null = null;

  if (localClient?.stripeCustomerId) {
    const existingCustomer = await stripe.customers
      .retrieve(localClient.stripeCustomerId)
      .catch(() => null);
    if (existingCustomer && !existingCustomer.deleted) {
      customerId = existingCustomer.id;
    }
  }

  if (!customerId) {
    const existingCustomers = await stripe.customers.list({ email: clientEmail, limit: 1 });
    customerId =
      existingCustomers.data[0]?.id ??
      (await stripe.customers.create({ email: clientEmail, name: clientName ?? undefined })).id;
  }

  for (const item of resolvedItems) {
    const useSavedPrice =
      item.product?.stripePriceId && item.product.unitAmount === item.unitAmountCents;

    if (useSavedPrice) {
      await stripe.invoiceItems.create({
        customer: customerId,
        description: item.description,
        quantity: item.quantity,
        pricing: { price: item.product!.stripePriceId! },
      });
      continue;
    }

    await stripe.invoiceItems.create({
      customer: customerId,
      currency,
      description:
        item.quantity > 1
          ? `${item.description} (${item.quantity} x ${formatCents(item.unitAmountCents, currency)})`
          : item.description,
      amount: item.quantity * item.unitAmountCents,
    });
  }

  const taxRateIds = taxPercent > 0 ? [await resolveTaxRateId(taxPercent)] : undefined;
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });
  const brandBusinessName = profile?.businessName ?? businessName ?? user.email.split("@")[0];
  const brandFooter =
    profile?.invoiceFooter ?? `Payment is processed securely by iDesignLC for ${brandBusinessName}.`;

  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: dueInDays,
    pending_invoice_items_behavior: "include",
    default_tax_rates: taxRateIds,
    transfer_data: { destination: acct },
    application_fee_amount: feeCents,
    custom_fields: [{ name: "Service provider", value: brandBusinessName.slice(0, 140) }],
    footer: brandFooter.slice(0, 500),
  });

  let sent = await stripe.invoices.finalizeInvoice(invoice.id!, { auto_advance: false });
  if (deliveryMode === "stripe_email") {
    sent = await stripe.invoices.sendInvoice(invoice.id!);
  }

  const summary =
    items.length === 1
      ? items[0].description
      : `${items[0].description} + ${items.length - 1} more`;

  const client = await prisma.client.upsert({
    where: { userId_email: { userId: user.id, email: normalizedClientEmail } },
    update: {
      name: clientName,
      stripeCustomerId: customerId,
      lastInvoicedAt: new Date(),
    },
    create: {
      userId: user.id,
      email: normalizedClientEmail,
      name: clientName,
      stripeCustomerId: customerId,
      lastInvoicedAt: new Date(),
    },
  });

  const savedInvoice = await prisma.invoice.create({
    data: {
      userId: user.id,
      clientId: client.id,
      stripeInvoiceId: sent.id!,
      stripeCustomerId: customerId,
      invoicePdfUrl: sent.invoice_pdf ?? null,
      stripeNumber: sent.number ?? null,
      clientEmail,
      clientName,
      description: summary,
      subtotal: sent.subtotal ?? subtotalCents,
      taxPercent,
      taxAmount: taxAmountCents,
      amount: sent.total ?? subtotalCents + taxAmountCents,
      feeAmount: feeCents,
      currency,
      status: "open",
      hostedInvoiceUrl: sent.hosted_invoice_url ?? null,
      deliveryMode,
      brandBusinessName,
      brandLogoUrl: profile?.logoUrl ?? null,
      brandColor: profile?.brandColor ?? "#c81010",
      brandSupportEmail: profile?.supportEmail ?? user.email,
      brandFooter,
      dueDate: sent.due_date ? new Date(sent.due_date * 1000) : null,
      lineItems: {
        create: resolvedItems.map((item, index) => ({
          productId: item.product?.id,
          description: item.description,
          productName: item.product?.name ?? item.description,
          productType: item.product?.type ?? item.productType,
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

  const publicInvoiceUrl = `${appUrl}/pay/${savedInvoice.publicToken}`;
  let brandedEmailSent = false;
  if (deliveryMode === "branded_email") {
    brandedEmailSent = await sendBrandedInvoiceEmail({
      to: clientEmail,
      clientName,
      businessName: brandBusinessName,
      invoiceDescription: summary,
      totalCents: sent.total ?? subtotalCents + taxAmountCents,
      currency,
      publicInvoiceUrl,
      supportEmail: profile?.supportEmail ?? user.email,
      footer: brandFooter,
    });
  }

  return NextResponse.json({
    ok: true,
    hostedInvoiceUrl: sent.hosted_invoice_url,
    publicInvoiceUrl,
    deliveryMode,
    brandedEmailSent,
  });
}
