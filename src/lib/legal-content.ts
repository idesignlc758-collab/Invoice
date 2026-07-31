// Plain-text mirror of src/app/terms/page.tsx, src/app/privacy/page.tsx, and
// src/app/refunds/page.tsx, used only to generate the PDF attached to the
// terms-agreement email (see legal-pdf.ts). The JSX pages are the source a
// browser renders; this file is the source the PDF renders. They're
// maintained by hand in parallel -- if you edit one, check the other.

export type LegalSection = { heading: string; body: string };
export type LegalDocument = { title: string; lastUpdated: string; sections: LegalSection[] };

export const TERMS_OF_SERVICE: LegalDocument = {
  title: "Terms of Service",
  lastUpdated: "28 July 2026",
  sections: [
    {
      heading: "1. Who we are",
      body: "Invoice by iDesignLC (\"the Service\") is operated by iDesignLC Agency (\"we\", \"us\"). By creating an account or using the Service you agree to these terms. If you don't agree, don't use the Service.",
    },
    {
      heading: "2. What the Service does",
      body: "The Service lets a business send invoices to its clients and collect card payments for them. Payments are processed by Stripe. We are not a bank, and we do not hold funds beyond the time needed to route them to the business.",
    },
    {
      heading: "3. Your account",
      body: "Businesses are responsible for the accuracy of the information they provide, for activity under their account, and for keeping sign-in credentials secure.",
    },
    {
      heading: "4. Stripe and payouts",
      body: "To receive money, a business connects a Stripe account through the Service and enters into an agreement directly with Stripe (the Stripe Connected Account Agreement, or in some countries the Stripe Recipient Agreement). Funds from a paid invoice are transferred to the connected Stripe account and paid out on the schedule Stripe sets for that account.",
    },
    {
      heading: "5. Fees",
      body: "We charge a platform fee of 5% of the pre-tax subtotal, plus 30 cents per invoice. Sales tax is passed through in full and is not included in our fee calculation. Stripe charges its own processing fees, set by Stripe, deducted from the amount the business receives.",
    },
    {
      heading: "6. Who bills the client",
      body: "iDesignLC Agency is the merchant of record for payments collected through the Service. Invoices are issued by us on the business's behalf, and the business's name appears on the invoice.",
    },
    {
      heading: "7. Acceptable use",
      body: "Invoices may only be issued for goods or services actually provided or agreed to be provided. The Service may not be used for any business Stripe prohibits or restricts, or to move money between people without an underlying transaction.",
    },
    {
      heading: "8. Taxes",
      body: "The business is solely responsible for determining what taxes apply to its invoices, for setting the correct rate, and for reporting and remitting those taxes.",
    },
    {
      heading: "9. Suspension and termination",
      body: "A business may stop using the Service at any time. We may suspend or close an account that breaches these terms, that Stripe declines or restricts, or that we reasonably believe is being used fraudulently.",
    },
    {
      heading: "10. Liability",
      body: "The Service is provided as-is. To the extent permitted by law, we are not liable for indirect or consequential losses, lost profits, or losses arising from a client failing to pay.",
    },
    {
      heading: "11. Changes",
      body: "We may update these terms. If a change materially affects you, we'll give notice before it takes effect.",
    },
    {
      heading: "12. Contact",
      body: "Questions about these terms: support@idesignlc.com.",
    },
  ],
};

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "31 July 2026",
  sections: [
    {
      heading: "1. Who this covers",
      body: "This policy covers businesses who create an account to send invoices through Invoice by iDesignLC, and their clients who receive and pay those invoices.",
    },
    {
      heading: "2. What we collect",
      body: "From businesses: email, name, and sign-in information (via Clerk); business profile (name, logo, address, brand color); invoices, estimates, and products created. From clients: the email and name a business enters when creating an invoice, and the IP address and browser information recorded at the moment of agreeing to our terms and refund policy. We never see or store full card numbers -- payment details go directly to Stripe.",
    },
    {
      heading: "3. How we use it",
      body: "To operate the Service: creating and sending invoices, processing payments and payouts, verifying connected Stripe accounts, sending transactional emails, and providing support. We don't sell personal information or use it for advertising.",
    },
    {
      heading: "4. Who we share it with",
      body: "Stripe (payment processing, identity verification, payouts), Clerk (sign-in and authentication), Mailtrap (transactional email delivery), and Vercel/Turso (hosting and database storage). We disclose information beyond this only if required by law, to investigate fraud, or to enforce our Terms of Service.",
    },
    {
      heading: "5. How long we keep it",
      body: "Account and invoice records are kept for as long as the account is active, and for a reasonable period afterward to meet accounting, tax, and dispute-resolution obligations. Terms-acceptance records are kept for as long as the related invoice could still be disputed or refunded.",
    },
    {
      heading: "6. Your rights",
      body: "You can ask us to access, correct, or delete the personal information we hold about you, subject to what we're required to retain for legal, tax, or dispute-related reasons.",
    },
    {
      heading: "7. Security",
      body: "We rely on our infrastructure providers' security controls and never store full payment card details ourselves. No system is completely secure.",
    },
    {
      heading: "8. Children",
      body: "The Service is intended for businesses and their adult clients and isn't directed at children under 16.",
    },
    {
      heading: "9. Changes",
      body: "We may update this policy. If a change materially affects how we handle your information, we'll give notice before it takes effect.",
    },
    {
      heading: "10. Contact",
      body: "Questions about this policy, or to make a data request: support@idesignlc.com.",
    },
  ],
};

export const REFUND_POLICY: LegalDocument = {
  title: "Refund Policy",
  lastUpdated: "31 July 2026",
  sections: [
    {
      heading: "If you paid an invoice",
      body: "Contact the business that sent you the invoice first. If you can't reach them, or believe the charge was not authorised, contact support@idesignlc.com.",
    },
    {
      heading: "Who processes the refund",
      body: "iDesignLC Agency is the merchant of record for payments collected through this platform, so refunds are issued by us at the direction of the business that invoiced you. Refunds are returned to the original payment method only.",
    },
    {
      heading: "You receive the full amount",
      body: "When a refund is approved, you get back exactly what you paid -- nothing is deducted from your refund. Any cost that can't be recovered from Stripe is absorbed by us, not passed on to you.",
    },
    {
      heading: "Refund window",
      body: "Refund requests should be raised within 6 days of payment. This window is intentionally short: funds typically sit in the connected account's Stripe balance for about a week before payout, so a request inside this window can almost always be reversed cleanly. Requests after 6 days are at the discretion of the business that issued the invoice, and may not be recoverable once funds have paid out.",
    },
    {
      heading: "Timing",
      body: "Once approved, a refund is submitted immediately. Card issuers typically take 5-10 business days to post it to the payer's statement.",
    },
    {
      heading: "Platform and processing fees",
      body: "On a refunded invoice, our platform fee (5% plus 30 cents per invoice) is returned in full to the business. The one cost nobody gets back is Stripe's own processing fee on the original charge -- Stripe never returns this once a payment is refunded. We absorb that cost ourselves.",
    },
    {
      heading: "Partial refunds",
      body: "A partial refund can be issued where only part of the work was delivered or an invoice was overstated. Any tax charged is refunded in proportion to the amount returned.",
    },
    {
      heading: "Disputes and chargebacks",
      body: "If a payer raises a dispute with their card issuer instead of requesting a refund, the card networks decide the outcome and the process can take several weeks. Requesting a refund directly is almost always faster.",
    },
    {
      heading: "Contact",
      body: "support@idesignlc.com.",
    },
  ],
};
