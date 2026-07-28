// Countries a connected account can be created in.
//
// This list mirrors exactly what's enabled under Connect > Settings in the
// Stripe Dashboard for acct_1RAa6cBgI9KTGRAU. Keep the two in sync — offering
// a country Stripe hasn't enabled fails at account creation, and enabling one
// here that the Dashboard doesn't allow does nothing.
//
// A connected account's country is fixed at creation and can never be changed,
// which is why it's collected before the account exists rather than during
// Stripe's hosted onboarding.
//
// CAVEAT: only US, CA, and GB are inside the set Stripe supports for
// cross-border transfers from a US platform. The others are reachable only
// under a `recipient` service agreement, which cannot request the
// card_payments capability or act as merchant of record — meaning the
// on_behalf_of/issuer branding in the invoice route won't apply to them. See
// createOnboardingRedirect, which surfaces a message instead of throwing if
// Stripe rejects the combination.
export const CONNECT_COUNTRIES = [
  { code: "AG", name: "Antigua & Barbuda" },
  { code: "AU", name: "Australia" },
  { code: "BS", name: "Bahamas" },
  { code: "CA", name: "Canada" },
  { code: "DO", name: "Dominican Republic" },
  { code: "JM", name: "Jamaica" },
  { code: "LC", name: "St. Lucia" },
  { code: "TT", name: "Trinidad & Tobago" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
] as const;

const VALID_CODES = new Set(CONNECT_COUNTRIES.map((country) => country.code as string));

export function isSupportedCountry(code: string): boolean {
  return VALID_CODES.has(code);
}
