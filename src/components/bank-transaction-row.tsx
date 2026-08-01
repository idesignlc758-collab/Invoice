"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/format";

type Candidate = { type: "expense" | "invoice" | "saleReceipt"; id: string; label: string };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function BankTransactionRow({
  transaction,
  candidates,
  matchedLabel,
}: {
  transaction: { id: string; date: Date; description: string; amount: number; isReconciled: boolean };
  candidates: Candidate[];
  matchedLabel: string | null;
}) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function match() {
    if (!selected) return;
    const [type, id] = selected.split(":");
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/bank-transactions/${transaction.id}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, recordId: id }),
    });
    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Could not match this transaction.");
      return;
    }
    setPicking(false);
    router.refresh();
  }

  async function unmatch() {
    setLoading(true);
    await fetch(`/api/bank-transactions/${transaction.id}/unmatch`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-3 py-2 text-muted">{formatDate(transaction.date)}</td>
      <td className="px-3 py-2">{transaction.description}</td>
      <td
        className={`px-3 py-2 text-right tabular-nums ${
          transaction.amount >= 0 ? "text-success" : ""
        }`}
      >
        {formatCents(transaction.amount)}
      </td>
      <td className="px-3 py-2 text-right">
        {transaction.isReconciled ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted">{matchedLabel ?? "Matched"}</span>
            <button type="button" onClick={unmatch} disabled={loading} className="text-xs font-medium text-danger">
              Unmatch
            </button>
          </div>
        ) : picking ? (
          <div className="flex items-center justify-end gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded-lg border border-line bg-background px-2 py-1 text-xs"
            >
              <option value="">Choose…</option>
              {candidates.map((c) => (
                <option key={`${c.type}:${c.id}`} value={`${c.type}:${c.id}`}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={match}
              disabled={!selected || loading}
              className="rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-contrast disabled:opacity-50"
            >
              Match
            </button>
            <button type="button" onClick={() => setPicking(false)} className="text-xs text-muted">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            disabled={candidates.length === 0}
            className="text-xs font-medium text-accent disabled:text-muted"
          >
            {candidates.length === 0 ? "No matches" : "Match"}
          </button>
        )}
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </td>
    </tr>
  );
}
