"use client";

import { useState } from "react";

export function InvoicePaymentGate({
  hostedInvoiceUrl,
  publicToken,
  terms,
  brandColor,
}: {
  hostedInvoiceUrl: string;
  publicToken: string;
  terms: string | null;
  brandColor: string;
}) {
  const [businessTermsAccepted, setBusinessTermsAccepted] = useState(false);
  const [platformTermsAccepted, setPlatformTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requiresBusinessTerms = Boolean(terms?.trim());
  const canContinue = platformTermsAccepted && (!requiresBusinessTerms || businessTermsAccepted);

  async function continueToPayment() {
    if (!canContinue) return;
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/invoices/${publicToken}/accept-terms`, {
      method: "POST",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not record your agreement. Try again.");
      setLoading(false);
      return;
    }

    window.location.assign(hostedInvoiceUrl);
  }

  const disabledReason = !canContinue ? "Check the box(es) above to continue." : null;

  return (
    <div className="mt-6">
      {requiresBusinessTerms && (
        <div className="mb-4 rounded-2xl border border-line bg-background p-4">
          <p className="font-display text-base font-bold">Terms and conditions</p>
          <div
            tabIndex={0}
            role="region"
            aria-label="Terms and conditions"
            className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-card p-3 text-sm leading-relaxed text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {terms}
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={businessTermsAccepted}
              onChange={(event) => setBusinessTermsAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            <span>I agree to the terms and conditions for this invoice.</span>
          </label>
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-line bg-background p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={platformTermsAccepted}
            onChange={(event) => setPlatformTermsAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
          />
          <span>
            I agree to Invoice by iDesignLC&apos;s{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Terms of Service
            </a>
            ,{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Privacy Policy
            </a>
            , and{" "}
            <a
              href="/refunds"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Refund Policy
            </a>
            .
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={continueToPayment}
        disabled={loading || !canContinue}
        aria-describedby={disabledReason ? "pay-button-hint" : undefined}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-45"
        style={{ backgroundColor: brandColor }}
      >
        {loading ? "Opening secure payment..." : "Pay securely with Stripe"}
      </button>
      {disabledReason && (
        <p id="pay-button-hint" className="mt-2 text-center text-xs text-muted">
          {disabledReason}
        </p>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        If this invoice is refunded, you receive the full amount back to your original payment
        method.{" "}
        <a
          href="/refunds"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Refund Policy
        </a>
      </p>
    </div>
  );
}
