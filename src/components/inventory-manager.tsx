"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

type Product = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  sku: string | null;
  quantityOnHand: number;
  unitCost: number;
  reorderPoint: number;
};

const REASONS = [
  { value: "purchase", label: "Purchase (stock in)" },
  { value: "return", label: "Return (stock in)" },
  { value: "sale", label: "Sale (stock out)" },
  { value: "adjustment", label: "Adjustment" },
];

function ItemAdjustRow({ item }: { item: Item }) {
  const router = useRouter();
  const [adjusting, setAdjusting] = useState(false);
  const [quantityChange, setQuantityChange] = useState("");
  const [reason, setReason] = useState("purchase");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lowStock = item.quantityOnHand <= item.reorderPoint;

  async function submit() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/inventory/${item.id}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantityChange: Number(quantityChange), reason }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not adjust stock.");
      return;
    }
    setAdjusting(false);
    setQuantityChange("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {item.name}
            {item.sku ? <span className="ml-2 text-xs text-muted">{item.sku}</span> : null}
          </p>
          <p className={`mt-1 text-sm ${lowStock ? "text-danger" : "text-muted"}`}>
            {item.quantityOnHand} on hand
            {lowStock ? " · low stock" : ""} · {formatCents(item.unitCost)}/unit
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdjusting((v) => !v)}
          className="shrink-0 text-xs font-medium text-accent"
        >
          {adjusting ? "Cancel" : "Adjust"}
        </button>
      </div>
      {adjusting && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={quantityChange}
            onChange={(e) => setQuantityChange(e.target.value)}
            placeholder="+10 or -5"
            className="w-24 rounded-lg border border-line bg-card px-2 py-1.5 text-sm"
          />
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-line bg-card px-2 py-1.5 text-sm"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !quantityChange}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-contrast disabled:opacity-50"
          >
            Save
          </button>
          {error && <p className="w-full text-xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function InventoryManager({ items, products }: { items: Item[]; products: Product[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [quantityOnHand, setQuantityOnHand] = useState("0");
  const [unitCost, setUnitCost] = useState("");
  const [reorderPoint, setReorderPoint] = useState("0");
  const [productId, setProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sku, quantityOnHand, unitCost, reorderPoint, productId: productId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save the item.");
      return;
    }
    setName("");
    setSku("");
    setQuantityOnHand("0");
    setUnitCost("");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createItem} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add inventory item</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ceramic mug"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              SKU <span className="text-muted">(optional)</span>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            {products.length > 0 && (
              <label className="flex flex-col gap-1.5 text-sm">
                Linked product <span className="text-muted">(optional)</span>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">None</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm">
              Qty on hand
              <input
                type="number"
                value={quantityOnHand}
                onChange={(e) => setQuantityOnHand(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Unit cost
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                <span className="mr-1 text-muted">$</span>
                <input
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Reorder at
              <input
                type="number"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
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
            {loading ? "Saving…" : "Save item"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Items</h2>
          <span className="text-sm text-muted">{items.length} items</span>
        </div>
        <div className="flex flex-col gap-3">
          {items.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No inventory items yet. Add one on the left.
            </p>
          )}
          {items.map((item) => (
            <ItemAdjustRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
