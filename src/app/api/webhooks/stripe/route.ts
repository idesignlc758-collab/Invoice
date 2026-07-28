import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendInvoicePaidEmail, sendOnboardingReadyEmail } from "@/lib/mail";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // Connect platforms need two event destinations pointing here: one scoped to
  // this account (invoice.*) and one scoped to connected accounts
  // (account.updated). Stripe issues a separate signing secret per destination,
  // so try each until one verifies.
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  ].filter((secret): secret is string => Boolean(secret));

  if (!signature || secrets.length === 0) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event | undefined;
  let verifyError = "Invalid signature";
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch (err) {
      verifyError = err instanceof Error ? err.message : "Invalid signature";
    }
  }

  if (!event) {
    return NextResponse.json({ error: verifyError }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({ data: { stripeEventId: event.id, type: event.type } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Already processed this event.
      return NextResponse.json({ received: true });
    }
    throw err;
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const user = await prisma.user.findUnique({ where: { stripeAccountId: account.id } });
      if (user && user.onboardingStatus !== "ready" && account.charges_enabled && account.payouts_enabled) {
        await prisma.user.update({
          where: { id: user.id },
          data: { onboardingStatus: "ready" },
        });
        await sendOnboardingReadyEmail(user.email);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const local = await prisma.invoice.findUnique({
        where: { stripeInvoiceId: invoice.id },
        include: { user: true },
      });
      if (local && local.status !== "paid") {
        await prisma.invoice.update({
          where: { id: local.id },
          data: { status: "paid", paidAt: new Date() },
        });
        await sendInvoicePaidEmail({
          to: local.user.email,
          invoiceDescription: local.description,
          totalCents: local.amount,
          feeCents: local.feeAmount,
          currency: local.currency,
          clientName: local.clientName,
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await prisma.invoice.updateMany({
        where: { stripeInvoiceId: invoice.id },
        data: { status: "payment_failed" },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
