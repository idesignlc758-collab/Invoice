import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, calculateFeeAmount } from "@/lib/stripe";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.onboardingStatus !== "ready" || !user.stripeAccountId) {
    return NextResponse.json(
      { error: "Connect your Stripe account before sending invoices." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const clientEmail = String(body.clientEmail ?? "").trim();
  const clientName = body.clientName ? String(body.clientName).trim() : null;
  const description = String(body.description ?? "").trim();
  const amountDollars = Number(body.amount);
  const dueDateStr = body.dueDate ? String(body.dueDate) : null;

  if (!clientEmail || !description || !Number.isFinite(amountDollars) || amountDollars <= 0) {
    return NextResponse.json(
      { error: "Enter a client email, description, and an amount greater than 0." },
      { status: 400 }
    );
  }

  const currency = "usd";
  const amountCents = Math.round(amountDollars * 100);
  const feeCents = calculateFeeAmount(amountCents);
  const acct = user.stripeAccountId;

  const existingCustomers = await stripe.customers.list({ email: clientEmail, limit: 1 });
  const customer =
    existingCustomers.data[0] ??
    (await stripe.customers.create({ email: clientEmail, name: clientName ?? undefined }));

  await stripe.invoiceItems.create({
    customer: customer.id,
    amount: amountCents,
    currency,
    description,
  });

  const dueDateEpoch = dueDateStr ? Math.floor(new Date(dueDateStr).getTime() / 1000) : undefined;

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    due_date: dueDateEpoch,
    pending_invoice_items_behavior: "include",
    transfer_data: { destination: acct },
    application_fee_amount: feeCents,
    on_behalf_of: acct,
    issuer: { type: "account", account: acct },
  });

  await stripe.invoices.finalizeInvoice(invoice.id!);
  const sent = await stripe.invoices.sendInvoice(invoice.id!);

  await prisma.invoice.create({
    data: {
      userId: user.id,
      stripeInvoiceId: sent.id!,
      stripeCustomerId: customer.id,
      clientEmail,
      clientName,
      description,
      amount: amountCents,
      feeAmount: feeCents,
      currency,
      status: "open",
      hostedInvoiceUrl: sent.hosted_invoice_url ?? null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
    },
  });

  return NextResponse.json({ ok: true, hostedInvoiceUrl: sent.hosted_invoice_url });
}
