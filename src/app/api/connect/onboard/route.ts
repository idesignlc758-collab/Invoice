import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

async function createOnboardingRedirect() {
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL), 303);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
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
