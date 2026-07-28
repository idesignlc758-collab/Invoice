"use client";

import { useState } from "react";

export function InvoiceActions({
  hostedInvoiceUrl,
  amountLabel,
}: {
  hostedInvoiceUrl: string | null;
  amountLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!hostedInvoiceUrl) return null;

  async function share() {
    if (!hostedInvoiceUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invoice",
          text: `Pay ${amountLabel}`,
          url: hostedInvoiceUrl,
        });
        return;
      } catch {
        // Share sheet dismissed — fall through to copying instead.
      }
    }
    await navigator.clipboard.writeText(hostedInvoiceUrl);
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
        {copied ? "Link copied ✓" : "Share payment link"}
      </button>
      <a
        href={hostedInvoiceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-12 items-center justify-center rounded-full border border-line font-medium"
      >
        {"Open invoice ↗︎"}
      </a>
    </div>
  );
}
