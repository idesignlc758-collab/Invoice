import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy — Invoice by iDesignLC",
  description: "How refunds work for invoices paid through Invoice by iDesignLC.",
};

const LAST_UPDATED = "28 July 2026";

export default function RefundsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 px-6 py-12 focus:outline-none">
      <article className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back
        </Link>

        <h1 className="font-display text-3xl font-extrabold mt-6 mb-2">Refund Policy</h1>
        <p className="text-sm text-muted mb-10">Last updated {LAST_UPDATED}</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold mb-2">If you paid an invoice</h2>
            <p className="text-muted">
              Contact the business that sent you the invoice first. They provided the goods or
              services and decide whether a refund is due. Their name appears on your invoice and
              receipt. If you can&apos;t reach them, or you believe the charge was not authorised,
              contact us at{" "}
              <a href="mailto:support@idesignlc.com" className="text-accent">
                support@idesignlc.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Who processes the refund</h2>
            <p className="text-muted">
              iDesignLC Agency is the merchant of record for payments collected through this
              platform, so refunds are issued by us at the direction of the business that invoiced
              you. Refunds are returned to the original payment method. We cannot send a refund to a
              different card or account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">You receive the full amount</h2>
            <p className="text-muted">
              When a refund is approved, you get back exactly what you paid — nothing is deducted
              from your refund. Any cost that can&apos;t be recovered from Stripe is absorbed by us,
              not passed on to you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Refund window</h2>
            <p className="text-muted">
              Refund requests should be raised within{" "}
              <strong className="text-foreground">6 days</strong> of payment. This window is
              intentionally short: funds typically sit in the connected account&apos;s Stripe
              balance for about a week before payout, so a request inside this window can almost
              always be reversed cleanly. Requests after 6 days are at the discretion of the
              business that issued the invoice, and may not be recoverable from the connected
              account once funds have paid out.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Timing</h2>
            <p className="text-muted">
              Once approved, a refund is submitted immediately. Card issuers typically take 5–10
              business days to post it to the payer&apos;s statement. That timing is set by the bank,
              not by us.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Platform and processing fees</h2>
            <p className="text-muted">
              On a refunded invoice, our platform fee (5% of the pre-tax subtotal, plus 30¢ per
              invoice) is <strong className="text-foreground">returned in full</strong> to the
              business, so refunding a client doesn&apos;t leave the business worse off than if the
              invoice had never been paid. The one cost nobody gets back is Stripe&apos;s own
              processing fee on the original charge — Stripe never returns this once a payment is
              refunded, on any platform. We absorb that cost ourselves rather than passing it to the
              business or the client.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Partial refunds</h2>
            <p className="text-muted">
              A partial refund can be issued where only part of the work was delivered or an invoice
              was overstated. Any tax charged is refunded in proportion to the amount returned.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Disputes and chargebacks</h2>
            <p className="text-muted">
              If a payer raises a dispute with their card issuer instead of requesting a refund, the
              card networks decide the outcome and the process can take several weeks. We will ask
              the business that issued the invoice for evidence that the goods or services were
              delivered. Requesting a refund directly is almost always faster.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">Contact</h2>
            <p className="text-muted">
              <a href="mailto:support@idesignlc.com" className="text-accent">
                support@idesignlc.com
              </a>
            </p>
          </section>

          <p className="text-muted border-t border-line pt-6">
            See also our{" "}
            <Link href="/terms" className="text-accent">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
