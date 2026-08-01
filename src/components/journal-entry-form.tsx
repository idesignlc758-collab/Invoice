"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatCents } from "@/lib/format";

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";

type Account = { id: string; code: string; name: string; type: string };
type Line = { id: string; accountId: string; description: string; debit: string; credit: string };

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function blankLine(): Line {
  return { id: crypto.randomUUID(), accountId: "", description: "", debit: "", credit: "" };
}

export function JournalEntryForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [date, setDate] = useState(todayInputValue());
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<Line[]>([blankLine(), blankLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(id: string, patch: Partial<Omit<Line, "id">>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function removeLine(id: string) {
    setLines((current) => (current.length > 2 ? current.filter((line) => line.id !== id) : current));
  }

  const totalDebitCents = lines.reduce((sum, line) => sum + Math.round((Number(line.debit) || 0) * 100), 0);
  const totalCreditCents = lines.reduce((sum, line) => sum + Math.round((Number(line.credit) || 0) * 100), 0);
  const isBalanced = totalDebitCents === totalCreditCents && totalDebitCents > 0;
  const validLines = lines.filter(
    (line) => line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0)
  );

  const canSave = Boolean(date) && isBalanced && validLines.length >= 2;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const response = await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        memo,
        lines: validLines.map((line) => ({
          accountId: line.accountId,
          description: line.description || undefined,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save the journal entry.");
      return;
    }

    router.push(`/journal-entries/${data.entry.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Memo <span className="text-muted">(optional)</span>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="What is this entry for?"
            className={inputClass}
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Lines</p>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, blankLine()])}
            className="flex items-center gap-1 text-sm font-bold text-accent"
          >
            <Plus className="h-4 w-4" /> Add line
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <div key={line.id} className="flex flex-col gap-2 rounded-2xl border border-line p-3 sm:flex-row sm:items-center">
              <select
                value={line.accountId}
                onChange={(e) => updateLine(line.id, { accountId: e.target.value })}
                className={`${inputClass} sm:flex-1`}
              >
                <option value="">Choose account…</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
              <input
                value={line.description}
                onChange={(e) => updateLine(line.id, { description: e.target.value })}
                placeholder="Description"
                className={`${inputClass} sm:flex-1`}
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={line.debit}
                onChange={(e) => updateLine(line.id, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                placeholder="Debit"
                className={`${inputClass} sm:w-28`}
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={line.credit}
                onChange={(e) => updateLine(line.id, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                placeholder="Credit"
                className={`${inputClass} sm:w-28`}
              />
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={lines.length === 2}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-danger disabled:opacity-30"
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 text-sm ${
          isBalanced ? "border-success/40 bg-success-soft text-success" : "border-line bg-background text-muted"
        }`}
      >
        <div className="flex justify-between">
          <span>Total debits</span>
          <span className="tabular-nums">{formatCents(totalDebitCents)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Total credits</span>
          <span className="tabular-nums">{formatCents(totalCreditCents)}</span>
        </div>
        <p className="mt-2 font-medium">
          {isBalanced ? "Balanced" : `Out of balance by ${formatCents(Math.abs(totalDebitCents - totalCreditCents))}`}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSave || saving}
        className="min-h-12 w-full rounded-2xl bg-accent px-5 py-3 font-display font-bold text-accent-contrast disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
      >
        {saving ? "Posting…" : "Post entry"}
      </button>
    </form>
  );
}
