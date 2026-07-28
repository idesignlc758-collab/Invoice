import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isSupportedCountry } from "@/lib/connect-countries";

async function createOnboardingRedirect(requestedCountry?: string) {
  const user = await getCurrentUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const backToDashboard = (status: string, detail?: string, country?: string) => {
    const url = new URL("/dashboard", appUrl);
    url.searchParams.set("onboarding", status);
    // Pass Stripe's own wording through. A generic "try another country"
    // message hides whether the problem is the country, a capability, or the
    // platform's Connect settings — which are very different fixes.
    if (detail) url.searchParams.set("reason", detail.slice(0, 300));
    if (country) url.searchParams.set("country", country);
    return NextResponse.redirect(url, 303);
  };

  let accountId = user.stripeAccountId;

  // Country is immutable on a Stripe account. If someone picked the wrong one
  // and never finished onboarding, the only way out is a fresh account — so
  // detach the old one rather than leaving them permanently stuck.
  if (accountId && requestedCountry && isSupportedCountry(requestedCountry)) {
    try {
      const existing = await stripe.accounts.retrieve(accountId);
      if (existing.country !== requestedCountry && !existing.charges_enabled) {
        accountId = null;
      }
    } catch {
      // Unreadable (deleted upstream, or created with a different key).
      accountId = null;
    }
  }

  if (!accountId) {
    // A connected account's country is permanent, so it has to be chosen
    // before the account exists — Stripe's hosted onboarding can't change it.
    if (!requestedCountry || !isSupportedCountry(requestedCountry)) {
      return backToDashboard("country_required", undefined, requestedCountry);
    }

    try {
      // Only `transfers` is requested. The platform is the merchant of record
      // and collects the card payment itself, so connected accounts never need
      // card_payments — and requesting it would rule out every country that
      // only supports the `recipient` service agreement, which is most of the
      // list outside the US, Canada, and the UK.
      const account = await stripe.accounts.create({
        type: "express",
        country: requestedCountry,
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return backToDashboard("country_unsupported", message, requestedCountry);
    }

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

// Triggered by the "Connect with Stripe" button on the dashboard, which posts
// the chosen country alongside it.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const country = form ? String(form.get("country") ?? "") : "";
  return createOnboardingRedirect(country);
}

// Stripe redirects here (refresh_url) if an onboarding link expired or was
// invalid. The account already exists by then, so no country is needed.
export async function GET() {
  return createOnboardingRedirect();
}
