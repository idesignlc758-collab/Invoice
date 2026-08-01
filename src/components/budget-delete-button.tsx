"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BudgetDeleteButton({ budgetId }: { budgetId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteBudget() {
    setDeleting(true);
    const response = await fetch(`/api/budgets/${budgetId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/budgets");
      router.refresh();
    }
    setDeleting(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Delete this budget?</span>
        <button
          type="button"
          onClick={deleteBudget}
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
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium text-danger hover:underline"
    >
      Delete budget
    </button>
  );
}
