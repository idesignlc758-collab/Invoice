"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExpenseDeleteButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteExpense() {
    setDeleting(true);
    setError(null);
    const response = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not delete expense.");
      setDeleting(false);
      return;
    }
    router.push("/expenses");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Delete this expense?</span>
        <button
          type="button"
          onClick={deleteExpense}
          disabled={deleting}
          className="rounded-full bg-danger px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-line px-3 py-1.5 text-sm font-medium"
        >
          Cancel
        </button>
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-danger hover:underline"
    >
      Delete expense
    </button>
  );
}
