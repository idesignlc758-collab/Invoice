"use client";

import { useState } from "react";

export function InvoiceActions({
  hostedInvoiceUrl,
  publicInvoiceUrl,
  invoicePdfUrl,
  amountLabel,
}: {
  hostedInvoiceUrl: string | null;
  publicInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  amountLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = publicInvoiceUrl ?? hostedInvoiceUrl;

  if (!shareUrl) return null;

  async function share() {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invoice",
          text: `Pay ${amountLabel}`,
          url: shareUrl,
        });
        return;
      } catch {
        // Share sheet dismissed, so copy instead.
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={share}
        className="min-h-12 rounded-full bg-accent font-display font-bold text-accent-contrast"
      >
        {copied ? "Link copied" : "Share branded invoice"}
      </button>
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 items-center justify-center rounded-full border border-line font-medium"
      >
        Open branded invoice
      </a>
      {hostedInvoiceUrl && hostedInvoiceUrl !== shareUrl && (
        <a
          href={hostedInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-full border border-line text-sm font-medium"
        >
          Open Stripe payment page
        </a>
      )}
      {invoicePdfUrl && (
        <a
          href={invoicePdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center rounded-full border border-line text-sm font-medium"
        >
          Download PDF
        </a>
      )}
    </div>
  );
}
