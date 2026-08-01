"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PayRunFinalizeButton({ payRunId }: { payRunId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finalize() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/pay-runs/${payRunId}/finalize`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not finalize this pay run.");
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          This logs a Payroll expense per employee for their gross pay. It doesn&apos;t send money
          or file taxes.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={finalize}
            disabled={loading}
            className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Finalizing…" : "Confirm finalize"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-2xl border border-line px-4 py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-contrast"
    >
      Finalize pay run
    </button>
  );
}
