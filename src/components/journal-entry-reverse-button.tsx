"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JournalEntryReverseButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reverse() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/journal-entries/${entryId}/reverse`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not reverse this entry.");
      return;
    }
    router.push(`/journal-entries/${data.entry.id}`);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          This posts a new entry with every line&apos;s debit and credit swapped.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reverse}
            disabled={loading}
            className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Reversing…" : "Confirm reversal"}
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
      className="rounded-2xl border border-line px-4 py-2.5 text-sm font-bold"
    >
      Reverse entry
    </button>
  );
}
