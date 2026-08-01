"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type Asset = {
  id: string;
  name: string;
  cost: number;
  bookValue: number;
  accumulatedDepreciation: number;
  isFullyDepreciated: boolean;
  isDisposed: boolean;
};

export function FixedAssetManager({ assets }: { assets: Asset[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(todayInputValue());
  const [cost, setCost] = useState("");
  const [usefulLifeMonths, setUsefulLifeMonths] = useState("36");
  const [salvageValue, setSalvageValue] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/fixed-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, purchaseDate, cost, usefulLifeMonths, salvageValue }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save asset.");
      return;
    }
    setName("");
    setCost("");
    router.refresh();
  }

  async function dispose(id: string) {
    await fetch(`/api/fixed-assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDisposed: true }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createAsset} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add fixed asset</h2>
        <p className="mt-1 text-sm text-muted">
          Straight-line depreciation for your own tracking — not a tax schedule.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="MacBook Pro"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Purchase date
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Cost
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                <span className="mr-1 text-muted">$</span>
                <input
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Useful life (months)
              <input
                type="number"
                value={usefulLifeMonths}
                onChange={(e) => setUsefulLifeMonths(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Salvage value
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                <span className="mr-1 text-muted">$</span>
                <input
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
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
            {loading ? "Saving…" : "Save asset"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Assets</h2>
          <span className="text-sm text-muted">{assets.length} assets</span>
        </div>
        <div className="flex flex-col gap-3">
          {assets.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No fixed assets yet. Add one on the left.
            </p>
          )}
          {assets.map((asset) => (
            <div key={asset.id} className={`rounded-2xl bg-background p-4 ${asset.isDisposed ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{asset.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    Cost {formatCents(asset.cost)} · Depreciated {formatCents(asset.accumulatedDepreciation)}
                    {asset.isFullyDepreciated ? " · Fully depreciated" : ""}
                    {asset.isDisposed ? " · Disposed" : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-bold tabular-nums">
                    {formatCents(asset.bookValue)}
                  </p>
                  <p className="text-xs text-muted">book value</p>
                  {!asset.isDisposed && (
                    <button
                      type="button"
                      onClick={() => dispose(asset.id)}
                      className="mt-1 text-xs font-medium text-muted hover:text-danger"
                    >
                      Dispose
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
