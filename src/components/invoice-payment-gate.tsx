"use client";

import { useState } from "react";
import { ContractSignature } from "@/components/contract-signature";

export function InvoicePaymentGate({
  hostedInvoiceUrl,
  publicToken,
  terms,
  brandColor,
  businessName,
  requireSignature,
  senderSignatureData,
  senderSignerName,
  senderSignatureDateLabel,
  signatureData,
  signerName,
  signatureDateLabel,
}: {
  hostedInvoiceUrl: string;
  publicToken: string;
  terms: string | null;
  brandColor: string;
  businessName: string;
  requireSignature: boolean;
  senderSignatureData: string | null;
  senderSignerName: string | null;
  senderSignatureDateLabel: string | null;
  signatureData: string | null;
  signerName: string | null;
  signatureDateLabel: string | null;
}) {
  const [businessTermsAccepted, setBusinessTermsAccepted] = useState(false);
  const [platformTermsAccepted, setPlatformTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(Boolean(signatureData));
  const [signedName, setSignedName] = useState(signerName);
  const [signedDateLabel, setSignedDateLabel] = useState(signatureDateLabel);

  // The signature itself is the client's agreement to the business's terms,
  // so the plain checkbox below only applies when no signature is required.
  const requiresBusinessTerms = Boolean(terms?.trim()) && !requireSignature;
  const contractSatisfied = !requireSignature || signed;
  const canContinue =
    platformTermsAccepted && (!requiresBusinessTerms || businessTermsAccepted) && contractSatisfied;

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
      {requireSignature && (
        <div className="mb-4">
          {signed ? (
            <div className="rounded-2xl border border-line bg-background p-4">
              <p className="font-display text-base font-bold text-success">Contract signed</p>
              <p className="mt-1 text-sm text-muted">
                Signed by <span className="font-medium text-foreground">{signedName}</span>
                {signedDateLabel ? ` on ${signedDateLabel}` : ""}. A copy was emailed to both
                parties.
              </p>
            </div>
          ) : (
            <ContractSignature
              publicToken={publicToken}
              terms={terms ?? ""}
              businessName={businessName}
              senderSignatureData={senderSignatureData}
              senderSignerName={senderSignerName}
              senderSignatureDateLabel={senderSignatureDateLabel}
              onSigned={({ signerName: name, signatureDateLabel: dateLabel }) => {
                setSigned(true);
                setSignedName(name);
                setSignedDateLabel(dateLabel);
              }}
            />
          )}
        </div>
      )}

      {!contractSatisfied ? (
        <p className="rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
          Sign the agreement above to continue to payment.
        </p>
      ) : (
        <>
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
            If this invoice is refunded, you receive the full amount back to your original
            payment method.{" "}
            <a
              href="/refunds"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Refund Policy
            </a>
          </p>
        </>
      )}
    </div>
  );
}
