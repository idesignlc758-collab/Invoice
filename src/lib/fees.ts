// Percentage alone loses money on small invoices: Stripe's processing fee has
// a flat per-transaction component (roughly 30 cents) that doesn't shrink
// with the invoice size, so a pure percentage cut can fall below what Stripe
// charges once the invoice is small enough. Mirroring that flat component
// here keeps every invoice profitable, not just the larger ones.
export const PLATFORM_FEE_PERCENT = 5;
export const PLATFORM_FEE_FLAT_CENTS = 30;

export function calculateFeeAmount(subtotalCents: number): number {
  return Math.round(subtotalCents * (PLATFORM_FEE_PERCENT / 100)) + PLATFORM_FEE_FLAT_CENTS;
}
