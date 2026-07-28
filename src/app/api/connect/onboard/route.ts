import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

async function createOnboardingRedirect() {
  const user = await getCurrentUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeAccountId: accountId, onboardingStatus: "pending" },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appUrl}/api/connect/onboard`,
    return_url: `${appUrl}/api/connect/return`,
  });

  return NextResponse.redirect(accountLink.url, 303);
}

// Triggered by the "Connect with Stripe" button on the dashboard.
export async function POST() {
  return createOnboardingRedirect();
}

// Stripe redirects here (refresh_url) if an onboarding link expired or was invalid.
export async function GET() {
  return createOnboardingRedirect();
}
