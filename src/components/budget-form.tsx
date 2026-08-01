"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/lib/expense-constants";

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";

type Line = { id: string; category: string; monthlyAmount: string };

function blankLine(): Line {
  return { id: crypto.randomUUID(), category: "", monthlyAmount: "" };
}

export function BudgetForm() {
  const router = useRouter();
  const [name, setName] = useState(`${new Date().getFullYear()} Budget`);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(id: string, patch: Partial<Omit<Line, "id">>) {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function removeLine(id: string) {
    setLines((current) => (current.length > 1 ? current.filter((line) => line.id !== id) : current));
  }

  const validLines = lines.filter((line) => line.category && Number(line.monthlyAmount) > 0);
  const canSave = name.trim().length > 0 && Boolean(year) && validLines.length > 0;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const response = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        year: Number(year),
        lines: validLines.map((line) => ({
          category: line.category,
          monthlyAmount: Number(line.monthlyAmount),
        })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save the budget.");
      return;
    }

    router.push(`/budgets/${data.budget.id}`);
    router.refresh();
  }

  const usedCategories = new Set(lines.map((line) => line.category).filter(Boolean));

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Budget name
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Year
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputClass}
            required
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Categories</p>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, blankLine()])}
            className="flex items-center gap-1 text-sm font-bold text-accent"
          >
            <Plus className="h-4 w-4" /> Add category
          </button>
        </div>
        <p className="mb-2 text-xs text-muted">
          Set a monthly amount per category — it applies evenly across all 12 months.
        </p>
        <div className="flex flex-col gap-2">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-2 rounded-2xl border border-line p-3">
              <select
                value={line.category}
                onChange={(e) => updateLine(line.id, { category: e.target.value })}
                className={`${inputClass} flex-1`}
              >
                <option value="">Choose category…</option>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}
                    disabled={usedCategories.has(category) && category !== line.category}
                  >
                    {category}
                  </option>
                ))}
              </select>
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3">
                <span className="mr-1 text-muted">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={line.monthlyAmount}
                  onChange={(e) => updateLine(line.id, { monthlyAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-24 bg-transparent text-base focus:outline-none"
                />
              </div>
              <span className="text-xs text-muted">/mo</span>
              <button
                type="button"
                onClick={() => removeLine(line.id)}
                disabled={lines.length === 1}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-danger disabled:opacity-30"
                aria-label="Remove category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
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
        {saving ? "Saving…" : "Save budget"}
      </button>
    </form>
  );
}
