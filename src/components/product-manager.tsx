"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  description: string | null;
  unitAmount: number;
  currency: string;
  type: string;
  taxable: boolean;
  active: boolean;
  timesUsed: number;
};

export function ProductManager({ products }: { products: Product[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitAmount, setUnitAmount] = useState("");
  const [type, setType] = useState("service");
  const [taxable, setTaxable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, unitAmount, type, taxable }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save product.");
      return;
    }

    setName("");
    setDescription("");
    setUnitAmount("");
    setType("service");
    setTaxable(true);
    router.refresh();
  }

  async function setActive(id: string, active: boolean) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    router.refresh();
  }

  async function setProductTaxable(id: string, taxable: boolean) {
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taxable }),
    });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createProduct} className="rounded-3xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add product or service</h2>
        <p className="mt-1 text-sm text-muted">
          Save repeat work here, or save new items directly while creating an invoice.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website audit"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details for your own reference"
              rows={3}
              className="resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Price
              <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                <span className="mr-1 text-muted">$</span>
                <input
                  value={unitAmount}
                  onChange={(e) => setUnitAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="service">Service</option>
                <option value="product">Product</option>
                <option value="hourly">Hourly</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-background px-4 py-3 text-sm">
            <span>
              <span className="block font-medium">Apply tax by default</span>
              <span className="mt-0.5 block text-xs text-muted">
                New invoices will tax this product when a tax rate is entered.
              </span>
            </span>
            <input
              type="checkbox"
              checked={taxable}
              onChange={(e) => setTaxable(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
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
            {loading ? "Saving..." : "Save product"}
          </button>
        </div>
      </form>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Catalog</h2>
          <span className="text-sm text-muted">{products.length} active</span>
        </div>
        <div className="flex flex-col gap-3">
          {products.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              Products saved during invoice creation will appear here.
            </p>
          )}
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {product.type} - {product.taxable ? "tax applies" : "no tax"} - used{" "}
                    {product.timesUsed}x
                  </p>
                  {product.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-bold tabular-nums">
                    {formatCents(product.unitAmount, product.currency)}
                  </p>
                  <label className="mt-2 flex min-h-11 items-center justify-end gap-2 text-xs font-medium text-muted">
                    <span>Apply tax</span>
                    <input
                      type="checkbox"
                      checked={product.taxable}
                      onChange={(e) => setProductTaxable(product.id, e.target.checked)}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setActive(product.id, false)}
                    className="flex min-h-11 items-center justify-end text-xs font-medium text-muted hover:text-danger"
                  >
                    Archive
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
