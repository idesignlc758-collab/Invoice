import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const user = await getCurrentUser();
  if (!user.stripeAccountId) {
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL));
  }

  const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
  return NextResponse.redirect(loginLink.url);
}
