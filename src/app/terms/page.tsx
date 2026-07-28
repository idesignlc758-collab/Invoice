import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Invoice by iDesignLC",
  description: "The terms that govern use of Invoice by iDesignLC.",
};

const LAST_UPDATED = "28 July 2026";

export default function TermsPage() {
  return (
    <main className="flex-1 px-6 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back
        </Link>

        <h1 className="font-display text-3xl font-extrabold mt-6 mb-2">Terms of Service</h1>
        <p className="text-sm text-muted mb-10">Last updated {LAST_UPDATED}</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold mb-2">1. Who we are</h2>
            <p className="text-muted">
              Invoice by iDesignLC (&ldquo;the Service&rdquo;) is operated by iDesignLC Agency
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using the Service you
              agree to these terms. If you don&apos;t agree, don&apos;t use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">2. What the Service does</h2>
            <p className="text-muted">
              The Service lets you send invoices to your clients and collect card payments for them.
              Payments are processed by Stripe. We are not a bank, and we do not hold your funds
              beyond the time needed to route them to you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">3. Your account</h2>
            <p className="text-muted">
              You are responsible for the accuracy of the information you provide, for activity
              under your account, and for keeping your sign-in credentials secure. You must be
              legally able to enter into contracts in your country.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">4. Stripe and payouts</h2>
            <p className="text-muted mb-3">
              To receive money you must connect a Stripe account through the Service. In doing so
              you also enter into an agreement directly with Stripe — either the{" "}
              <a
                href="https://stripe.com/connect-account/legal/full"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent"
              >
                Stripe Connected Account Agreement
              </a>{" "}
              or, in countries where that agreement isn&apos;t offered, the{" "}
              <a
                href="https://stripe.com/connect-account/legal/recipient"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent"
              >
                Stripe Recipient Agreement
              </a>
              . Stripe decides whether to approve your account and may request identity or business
              documents directly from you.
            </p>
            <p className="text-muted">
              Funds from a paid invoice are transferred to your connected Stripe account and paid
              out on the schedule Stripe sets for that account. In some countries funds take an
              additional 24 hours to become available in your Stripe balance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">5. Fees</h2>
            <p className="text-muted mb-3">
              We charge a platform fee of <strong className="text-foreground">5%</strong>, calculated
              on the pre-tax subtotal of each invoice. Sales tax you add to an invoice is passed
              through to you in full and is not included in our fee calculation.
            </p>
            <p className="text-muted">
              Stripe charges its own processing fees, and applies a cross-border fee on payouts to
              accounts outside the United States. These are set by Stripe, not by us, and are
              deducted from the amount you receive.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">6. Who bills your client</h2>
            <p className="text-muted">
              iDesignLC Agency is the merchant of record for payments collected through the Service.
              Invoices are issued by us on your behalf, and your business name appears on the
              invoice so your client can identify you. You authorise us to invoice and collect
              payment from your clients for the goods or services you describe.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">7. Acceptable use</h2>
            <p className="text-muted">
              You may only invoice for goods or services you have actually provided or agreed to
              provide. You may not use the Service for any business Stripe prohibits or restricts —
              see{" "}
              <a
                href="https://stripe.com/restricted-businesses"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent"
              >
                Stripe&apos;s restricted businesses list
              </a>
              . You may not use the Service to move money between people without an underlying
              transaction.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">8. Taxes</h2>
            <p className="text-muted">
              You are solely responsible for determining what taxes apply to your invoices, for
              setting the correct rate, and for reporting and remitting those taxes to the relevant
              authority. We do not file or remit taxes on your behalf.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">9. Suspension and termination</h2>
            <p className="text-muted">
              You may stop using the Service at any time. We may suspend or close an account that
              breaches these terms, that Stripe declines or restricts, or that we reasonably believe
              is being used fraudulently. Money already owed to you will still be paid out, subject
              to any holds Stripe places.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">10. Liability</h2>
            <p className="text-muted">
              The Service is provided as-is. To the extent permitted by law, we are not liable for
              indirect or consequential losses, lost profits, or losses arising from your clients
              failing to pay. Nothing in these terms limits liability that cannot be limited by law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">11. Changes</h2>
            <p className="text-muted">
              We may update these terms. If a change materially affects you, we&apos;ll give notice
              before it takes effect. Continuing to use the Service after that means you accept the
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">12. Contact</h2>
            <p className="text-muted">
              Questions about these terms:{" "}
              <a href="mailto:support@idesignlc.com" className="text-accent">
                support@idesignlc.com
              </a>
              .
            </p>
          </section>

          <p className="text-muted border-t border-line pt-6">
            See also our{" "}
            <Link href="/refunds" className="text-accent">
              Refund Policy
            </Link>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
