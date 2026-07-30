import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe, calculateFeeAmount } from "@/lib/stripe";
import { formatCents } from "@/lib/format";
import { sendBrandedInvoiceEmail } from "@/lib/mail";
import { parseLineItems, summarizeItems } from "@/lib/line-items";

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

function parseEmailCopies(value: unknown, label: string) {
  const rawValues = Array.isArray(value)
    ? value.map((entry) => String(entry))
    : String(value ?? "")
        .split(/[\s,;]+/)
        .filter(Boolean);
  const uniqueEmails = Array.from(
    new Set(rawValues.map((entry) => entry.trim().toLowerCase()).filter(Boolean))
  );
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (uniqueEmails.length > 20) {
    return { emails: [], error: `${label} can include up to 20 recipients.` };
  }

  const invalid = uniqueEmails.find((email) => !emailPattern.test(email));
  if (invalid) {
    return { emails: [], error: `Enter a valid ${label} email address: ${invalid}` };
  }

  return { emails: uniqueEmails, error: null };
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
  const clientNote = String(body.clientNote ?? "").trim().slice(0, 1000) || null;
  const privateMemo = String(body.privateMemo ?? "").trim().slice(0, 1000) || null;
  const clientTerms = String(body.clientTerms ?? "").trim().slice(0, 4000) || null;
  const parsedCcEmails = parseEmailCopies(body.ccEmails, "CC");
  const parsedBccEmails = parseEmailCopies(body.bccEmails, "BCC");
  const items = parseLineItems(body.items);
  const deliveryMode = body.deliveryMode === "stripe_email" ? "stripe_email" : "branded_email";
  const estimateId = body.estimateId ? String(body.estimateId) : null;

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
  if (parsedCcEmails.error || parsedBccEmails.error) {
    return NextResponse.json(
      { error: parsedCcEmails.error ?? parsedBccEmails.error },
      { status: 400 }
    );
  }

  const sourceEstimate = estimateId
    ? await prisma.estimate.findFirst({
        where: { id: estimateId, userId: user.id },
        select: { id: true, status: true },
      })
    : null;

  if (estimateId && !sourceEstimate) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }
  if (sourceEstimate?.status === "converted") {
    return NextResponse.json({ error: "This estimate has already been converted." }, { status: 409 });
  }
  if (sourceEstimate && sourceEstimate.status !== "accepted") {
    return NextResponse.json(
      { error: "Only accepted estimates can be converted into invoices." },
      { status: 409 }
    );
  }

  const currency = "usd";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountCents,
    0
  );
  const taxableSubtotalCents = items.reduce(
    (sum, item) => sum + (item.taxable ? item.quantity * item.unitAmountCents : 0),
    0
  );
  const taxAmountCents = Math.round(taxableSubtotalCents * (taxPercent / 100));
  const feeCents = calculateFeeAmount(subtotalCents);
  const acct = user.stripeAccountId;
  const profile = await prisma.businessProfile.findUnique({ where: { userId: user.id } });

  if (
    deliveryMode === "branded_email" &&
    (!profile?.businessName || !profile.emailSenderName || !profile.replyToEmail)
  ) {
    return NextResponse.json(
      {
        error:
          "Complete Branding before sending branded invoices: business name, sender name, and reply-to email are required.",
      },
      { status: 409 }
    );
  }

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

  const taxRateIds = taxPercent > 0 ? [await resolveTaxRateId(taxPercent)] : undefined;

  for (const item of resolvedItems) {
    const useSavedPrice =
      item.product?.stripePriceId && item.product.unitAmount === item.unitAmountCents;

    if (useSavedPrice) {
      await stripe.invoiceItems.create({
        customer: customerId,
        description: item.description,
        quantity: item.quantity,
        pricing: { price: item.product!.stripePriceId! },
        tax_rates: item.taxable ? taxRateIds : [],
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
      tax_rates: item.taxable ? taxRateIds : [],
    });
  }

  const brandBusinessName = profile?.businessName ?? businessName ?? user.email.split("@")[0];
  const providerAddress = profile ? formatAddress(profile) : "";
  const brandFooter =
    profile?.invoiceFooter ??
    `Secure payment processed by iDesignLC Agency in partnership with Stripe for ${brandBusinessName}.`;
  const customFields = [
    { name: "Service provider", value: brandBusinessName.slice(0, 140) },
    ...(providerAddress
      ? [{ name: "Provider address", value: providerAddress.slice(0, 140) }]
      : []),
  ];

  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: dueInDays,
    pending_invoice_items_behavior: "include",
    transfer_data: { destination: acct },
    application_fee_amount: feeCents,
    custom_fields: customFields,
    description: clientNote ? clientNote.slice(0, 500) : undefined,
    footer: brandFooter.slice(0, 500),
  });

  let sent = await stripe.invoices.finalizeInvoice(invoice.id!, { auto_advance: false });
  if (deliveryMode === "stripe_email") {
    sent = await stripe.invoices.sendInvoice(invoice.id!);
  }

  const summary = summarizeItems(items);

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
      ccEmails: parsedCcEmails.emails.join(",") || null,
      bccEmails: parsedBccEmails.emails.join(",") || null,
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
      sourceEstimateId: sourceEstimate?.id ?? null,
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

  if (sourceEstimate) {
    await prisma.estimate.update({
      where: { id: sourceEstimate.id },
      data: {
        status: "converted",
        convertedAt: new Date(),
      },
    });
  }

  const publicInvoiceUrl = `${appUrl}/pay/${savedInvoice.publicToken}`;
  let brandedEmailSent = false;
  if (deliveryMode === "branded_email") {
    brandedEmailSent = await sendBrandedInvoiceEmail({
      to: clientEmail,
      cc: parsedCcEmails.emails,
      bcc: parsedBccEmails.emails,
      clientName,
      businessName: brandBusinessName,
      invoiceDescription: summary,
      totalCents: sent.total ?? subtotalCents + taxAmountCents,
      currency,
      publicInvoiceUrl,
      lineItems: resolvedItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amountCents: item.quantity * item.unitAmountCents,
      })),
      dueDate: sent.due_date ? new Date(sent.due_date * 1000) : null,
      brandColor: profile?.brandColor ?? "#c81010",
      logoUrl: profile?.logoUrl ?? null,
      senderName: profile?.emailSenderName ?? brandBusinessName,
      supportEmail: profile?.supportEmail ?? user.email,
      replyToEmail: profile?.replyToEmail ?? profile?.supportEmail ?? user.email,
      footer: brandFooter,
      clientNote,
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
