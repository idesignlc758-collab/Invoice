"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";
import { EXPENSE_CATEGORIES } from "@/lib/expense-constants";
import { RECURRING_FREQUENCIES } from "@/lib/recurrence";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Recurring = {
  id: string;
  templateName: string;
  description: string;
  category: string;
  amount: number;
  frequency: string;
  nextOccurrence: Date;
  isActive: boolean;
};

export function RecurringTransactionManager({ items }: { items: Recurring[] }) {
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/recurring-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateName, description, category, amount, frequency, startDate }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save the recurring transaction.");
      return;
    }
    setTemplateName("");
    setDescription("");
    setAmount("");
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/recurring-transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={create} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add recurring transaction</h2>
        <p className="mt-1 text-sm text-muted">
          Automatically logs an expense on schedule — runs once a day via a background job.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Template name
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Monthly hosting"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vercel Pro plan"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="" disabled>
                  Choose…
                </option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Amount
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                <span className="mr-1 text-muted">$</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Frequency
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {RECURRING_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Scheduled</h2>
          <span className="text-sm text-muted">{items.length} templates</span>
        </div>
        <div className="flex flex-col gap-3">
          {items.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No recurring transactions yet.
            </p>
          )}
          {items.map((item) => (
            <div key={item.id} className={`rounded-2xl bg-background p-4 ${item.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.templateName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.description} · {item.category} · {item.frequency}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {item.isActive ? `Next: ${formatDate(item.nextOccurrence)}` : "Paused"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-bold tabular-nums">{formatCents(item.amount)}</p>
                  <button
                    type="button"
                    onClick={() => toggleActive(item.id, !item.isActive)}
                    className="mt-1 text-xs font-medium text-muted hover:text-foreground"
                  >
                    {item.isActive ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
