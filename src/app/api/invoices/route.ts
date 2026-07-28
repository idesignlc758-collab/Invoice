import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe, calculateFeeAmount } from "@/lib/stripe";
import { formatCents } from "@/lib/format";

type IncomingItem = {
  description: string;
  quantity: number;
  unitAmountCents: number;
};

function parseItems(raw: unknown): IncomingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const description = String(item.description ?? "").trim();
      const quantity = Math.round(Number(item.quantity));
      const unitAmountCents = Math.round(Number(item.unitAmountCents));
      return { description, quantity, unitAmountCents };
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

// Stripe tax rates are reusable objects, so look for an existing one at this
// percentage before creating another. Without this every invoice would leave
// behind a duplicate rate.
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
  const clientName = body.clientName ? String(body.clientName).trim() : null;
  const items = parseItems(body.items);

  const requestedTax = Number(body.taxPercent);
  const taxPercent = Number.isFinite(requestedTax)
    ? Math.min(100, Math.max(0, requestedTax))
    : 0;

  // Stripe requires days_until_due whenever collection_method is send_invoice.
  // 0 means "due on receipt", which is what the "Pay now" preset sends.
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
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmountCents,
    0
  );
  const taxAmountCents = Math.round(subtotalCents * (taxPercent / 100));
  // The platform fee is taken on the pre-tax subtotal — sales tax is money the
  // user owes onward, not revenue to take a cut of.
  const feeCents = calculateFeeAmount(subtotalCents);
  const acct = user.stripeAccountId;

  // The platform is the merchant of record, so Stripe brands the invoice with
  // the platform's name. Without this the client sees only "iDesignLC" and has
  // no idea who actually did the work, so pull the connected account's
  // business name and surface it on the document.
  let businessName: string | null = null;
  try {
    const account = await stripe.accounts.retrieve(acct);
    businessName =
      account.business_profile?.name ??
      account.settings?.dashboard?.display_name ??
      null;
  } catch {
    // Non-fatal — an invoice without the attribution line still works.
  }

  const existingCustomers = await stripe.customers.list({ email: clientEmail, limit: 1 });
  const customer =
    existingCustomers.data[0] ??
    (await stripe.customers.create({ email: clientEmail, name: clientName ?? undefined }));

  for (const item of items) {
    // invoiceItems.create takes a flat amount — it has no inline price data,
    // and `pricing` only accepts an existing Price ID. So fold quantity into
    // the amount and spell it out in the description instead.
    await stripe.invoiceItems.create({
      customer: customer.id,
      currency,
      description:
        item.quantity > 1
          ? `${item.description} (${item.quantity} × ${formatCents(item.unitAmountCents, currency)})`
          : item.description,
      amount: item.quantity * item.unitAmountCents,
    });
  }

  const taxRateIds = taxPercent > 0 ? [await resolveTaxRateId(taxPercent)] : undefined;

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: dueInDays,
    pending_invoice_items_behavior: "include",
    default_tax_rates: taxRateIds,
    // The platform is the merchant of record: it collects the card payment,
    // keeps application_fee_amount, and transfers the remainder onward. No
    // on_behalf_of or issuer, because those make the connected account the
    // settlement merchant — which requires the card_payments capability and
    // rules out every `recipient` service agreement country.
    transfer_data: { destination: acct },
    application_fee_amount: feeCents,
    // Stripe caps custom field name at 40 chars and value at 140.
    ...(businessName
      ? {
          custom_fields: [{ name: "From", value: businessName.slice(0, 140) }],
          footer: `Billed by ${businessName} through iDesignLC.`,
        }
      : {}),
  });

  await stripe.invoices.finalizeInvoice(invoice.id!);
  const sent = await stripe.invoices.sendInvoice(invoice.id!);

  const summary =
    items.length === 1
      ? items[0].description
      : `${items[0].description} + ${items.length - 1} more`;

  await prisma.invoice.create({
    data: {
      userId: user.id,
      stripeInvoiceId: sent.id!,
      stripeCustomerId: customer.id,
      clientEmail,
      clientName,
      description: summary,
      // Prefer the totals Stripe finalized so our records match the document.
      subtotal: sent.subtotal ?? subtotalCents,
      taxPercent,
      taxAmount: taxAmountCents,
      amount: sent.total ?? subtotalCents + taxAmountCents,
      feeAmount: feeCents,
      currency,
      status: "open",
      hostedInvoiceUrl: sent.hosted_invoice_url ?? null,
      // Read the due date back off the finalized invoice so it matches what
      // Stripe actually put on the document, not a locally guessed timestamp.
      dueDate: sent.due_date ? new Date(sent.due_date * 1000) : null,
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
  });

  return NextResponse.json({ ok: true, hostedInvoiceUrl: sent.hosted_invoice_url });
}
