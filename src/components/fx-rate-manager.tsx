"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Rate = {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  asOf: Date;
};

export function FxRateManager({ rates }: { rates: Rate[] }) {
  const router = useRouter();
  const [fromCurrency, setFromCurrency] = useState("usd");
  const [toCurrency, setToCurrency] = useState("eur");
  const [rate, setRate] = useState("");
  const [asOf, setAsOf] = useState(todayInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/fx-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromCurrency, toCurrency, rate, asOf }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save the rate.");
      return;
    }
    setRate("");
    router.refresh();
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createRate} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add exchange rate</h2>
        <p className="mt-1 text-sm text-muted">
          Entered manually — used to convert amounts for consolidated reporting only, not live rates.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              From
              <input
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                maxLength={3}
                placeholder="usd"
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              To
              <input
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                maxLength={3}
                placeholder="eur"
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base uppercase focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            Rate (1 {fromCurrency.toUpperCase() || "?"} = ? {toCurrency.toUpperCase() || "?"})
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="decimal"
              placeholder="0.92"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            As of
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
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
            {loading ? "Saving…" : "Save rate"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Rates on file</h2>
          <span className="text-sm text-muted">{rates.length} rates</span>
        </div>
        <div className="flex flex-col gap-2">
          {rates.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No exchange rates yet. Add one on the left.
            </p>
          )}
          {rates.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl bg-background p-4 text-sm">
              <span>
                1 {r.fromCurrency.toUpperCase()} = {r.rate} {r.toCurrency.toUpperCase()}
              </span>
              <span className="text-muted">{formatDate(r.asOf)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
