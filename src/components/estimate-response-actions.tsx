"use client";

import { useState } from "react";

export function EstimateResponseActions({
  publicToken,
  brandColor,
  terms,
  disabled,
}: {
  publicToken: string;
  brandColor: string;
  terms: string | null;
  disabled: boolean;
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(!terms);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function respond(decision: "accept" | "decline") {
    setError(null);
    setLoading(decision);
    const res = await fetch(`/api/estimate-responses/${publicToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update this estimate.");
      return;
    }
    setStatus(data.status ?? decision);
  }

  if (status === "accepted") {
    return (
      <div className="mt-6 rounded-2xl bg-success-soft px-4 py-3 text-center text-sm font-medium text-success">
        Estimate accepted. The service provider can now convert it into an invoice.
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="mt-6 rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
        Estimate declined. The service provider has been notified by the dashboard status.
      </div>
    );
  }

  return (
    <div className="mt-6">
      {terms && (
        <label className="mb-4 flex items-start gap-3 rounded-2xl border border-line bg-background p-4 text-sm">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 h-4 w-4 accent-[var(--accent)]"
          />
          <span>
            I agree to the estimate terms and understand this is an approval to proceed, not a
            payment.
          </span>
        </label>
      )}

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled || !acceptedTerms || loading === "accept"}
          onClick={() => respond("accept")}
          className="min-h-12 rounded-full px-5 text-sm font-bold text-white disabled:opacity-40"
          style={{ backgroundColor: brandColor }}
        >
          {loading === "accept" ? "Accepting..." : "Accept estimate"}
        </button>
        <button
          type="button"
          disabled={disabled || loading === "decline"}
          onClick={() => respond("decline")}
          className="min-h-12 rounded-full border border-line px-5 text-sm font-bold disabled:opacity-40"
        >
          {loading === "decline" ? "Declining..." : "Decline"}
        </button>
      </div>
    </div>
  );
}
