import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PLATFORM_FEE_PERCENT = 5;

export function calculateFeeAmount(totalCents: number): number {
  return Math.round(totalCents * (PLATFORM_FEE_PERCENT / 100));
}
