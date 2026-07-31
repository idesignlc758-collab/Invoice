import Stripe from "stripe";

// Falls back to a placeholder so importing this module never crashes the
// build when STRIPE_SECRET_KEY isn't configured yet (e.g. a fresh Vercel
// project). Any real Stripe call made without a valid key will fail with a
// normal API error at request time instead of taking down the whole build.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured");

// Re-exported from ./fees (not defined here) so client components can import
// the fee math without pulling the Stripe SDK into the browser bundle.
export { PLATFORM_FEE_PERCENT, PLATFORM_FEE_FLAT_CENTS, calculateFeeAmount } from "./fees";
