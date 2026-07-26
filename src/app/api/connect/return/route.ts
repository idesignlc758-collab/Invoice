import { NextResponse } from "next/server";

// Stripe sends the user back here after hosted onboarding. This redirect alone
// isn't proof the account is fully verified — the account.updated webhook is
// what actually flips onboardingStatus to "ready".
export async function GET() {
  return NextResponse.redirect(
    new URL("/dashboard?onboarding=pending", process.env.NEXT_PUBLIC_APP_URL)
  );
}
