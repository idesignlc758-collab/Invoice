import Link from "next/link";
import type { Metadata } from "next";

// First-draft privacy policy. Written to accurately describe what this app
// actually collects and which third parties process it (Clerk, Stripe,
// Mailtrap, Vercel Blob) -- not boilerplate. Have a lawyer review before
// relying on it for compliance purposes (GDPR/CCPA scope depends on where
// your users are).
export const metadata: Metadata = {
  title: "Privacy Policy — Invoice by iDesignLC",
  description: "How Invoice by iDesignLC collects, uses, and protects your information.",
};

const LAST_UPDATED = "31 July 2026";

export default function PrivacyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 px-6 py-12 focus:outline-none">
      <article className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back
        </Link>

        <h1 className="font-display text-3xl font-extrabold mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted mb-10">Last updated {LAST_UPDATED}</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-display text-lg font-bold mb-2">1. Who this covers</h2>
            <p className="text-muted">
              This policy covers two groups: businesses who create an account to send invoices
              through Invoice by iDesignLC (&ldquo;the Service&rdquo;), and their clients who
              receive and pay those invoices. It&apos;s operated by iDesignLC Agency
              (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">2. What we collect</h2>
            <p className="text-muted mb-3">
              <strong className="text-foreground">From businesses:</strong> your email, name, and
              sign-in information (handled by our authentication provider, Clerk); your business
              profile (name, logo, address, brand color); and the invoices, estimates, and products
              you create.
            </p>
            <p className="text-muted mb-3">
              <strong className="text-foreground">From clients:</strong> the email and name a
              business enters when creating an invoice, and the IP address and browser information
              recorded at the moment you agree to our terms and the refund policy, as proof of that
              agreement.
            </p>
            <p className="text-muted">
              <strong className="text-foreground">We never see or store full card numbers.</strong>{" "}
              Payment details are entered directly into Stripe&apos;s own secure checkout and never
              pass through our servers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">3. How we use it</h2>
            <p className="text-muted">
              To operate the Service: creating and sending invoices, processing payments and
              payouts, verifying connected Stripe accounts, sending transactional emails (invoice
              delivery, payment confirmations, terms-acceptance records), and providing support.
              We don&apos;t sell personal information, and we don&apos;t use it for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">4. Who we share it with</h2>
            <p className="text-muted mb-3">
              We use a small number of service providers to run the Service, and share only what
              each one needs to do its job:
            </p>
            <ul className="list-disc pl-5 text-muted flex flex-col gap-1.5">
              <li>
                <strong className="text-foreground">Stripe</strong> — payment processing, identity
                verification for connected accounts, and payouts.
              </li>
              <li>
                <strong className="text-foreground">Clerk</strong> — account sign-in and
                authentication.
              </li>
              <li>
                <strong className="text-foreground">Mailtrap</strong> — delivering transactional
                emails (invoices, receipts, terms-acceptance confirmations).
              </li>
              <li>
                <strong className="text-foreground">Vercel and Turso</strong> — application hosting
                and database storage.
              </li>
            </ul>
            <p className="text-muted mt-3">
              We disclose information beyond this only if required by law, to investigate fraud, or
              to enforce our Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">5. How long we keep it</h2>
            <p className="text-muted">
              We keep account and invoice records for as long as the account is active, and for a
              reasonable period afterward to meet accounting, tax, and dispute-resolution
              obligations. Terms-acceptance records (timestamp, IP, browser) are kept for as long
              as the related invoice could still be disputed or refunded.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">6. Your rights</h2>
            <p className="text-muted">
              You can ask us to access, correct, or delete the personal information we hold about
              you, subject to what we&apos;re required to retain for legal, tax, or dispute-related
              reasons. Contact us at the address below to make a request.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">7. Security</h2>
            <p className="text-muted">
              We rely on our infrastructure providers&apos; security controls (encryption in
              transit, access controls) and never store full payment card details ourselves. No
              system is completely secure, and we can&apos;t guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">8. Children</h2>
            <p className="text-muted">
              The Service is intended for businesses and their adult clients. It isn&apos;t directed
              at children, and we don&apos;t knowingly collect information from anyone under 16.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">9. Changes</h2>
            <p className="text-muted">
              We may update this policy. If a change materially affects how we handle your
              information, we&apos;ll give notice before it takes effect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-2">10. Contact</h2>
            <p className="text-muted">
              Questions about this policy, or to make a data request:{" "}
              <a href="mailto:support@idesignlc.com" className="text-accent">
                support@idesignlc.com
              </a>
              .
            </p>
          </section>

          <p className="text-muted border-t border-line pt-6">
            See also our{" "}
            <Link href="/terms" className="text-accent">
              Terms of Service
            </Link>{" "}
            and{" "}
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
