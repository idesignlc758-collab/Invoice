"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCents, initials } from "@/lib/format";

const EXPIRY_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
];

type RecentClient = {
  clientEmail: string;
  clientName: string | null;
  description: string;
  amount: number;
};

type SavedProduct = {
  id: string;
  name: string;
  description: string | null;
  unitAmount: number;
  currency: string;
  type: string;
  taxable: boolean;
};

type EstimateItem = {
  id: string;
  description: string;
  quantity: number;
  unitCents: number;
  productId: string | null;
  productType: string;
  taxable: boolean;
  saveProduct: boolean;
};

function blankItem(): EstimateItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitCents: 0,
    productId: null,
    productType: "service",
    taxable: true,
    saveProduct: false,
  };
}

export function NewEstimateFlow({
  recentClients,
  products,
  defaultTerms,
  defaultClientNote,
}: {
  recentClients: RecentClient[];
  products: SavedProduct[];
  defaultTerms: string;
  defaultClientNote: string;
}) {
  const router = useRouter();
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [clientNote, setClientNote] = useState(defaultClientNote);
  const [terms, setTerms] = useState(defaultTerms);
  const [privateMemo, setPrivateMemo] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
  const taxableSubtotalCents = items.reduce(
    (sum, item) => sum + (item.taxable ? item.quantity * item.unitCents : 0),
    0
  );
  const taxCents = Math.round(taxableSubtotalCents * (taxPercent / 100));
  const totalCents = subtotalCents + taxCents;
  const invoiceRows = items.filter((item) => item.description.trim() || item.unitCents > 0);
  const canSend =
    clientEmail.trim().length > 3 &&
    items.length > 0 &&
    items.every(
      (item) => item.description.trim().length > 0 && item.quantity > 0 && item.unitCents > 0
    );

  function updateItem(id: string, patch: Partial<Omit<EstimateItem, "id">>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addProduct(product: SavedProduct) {
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        description: product.name,
        quantity: 1,
        unitCents: product.unitAmount,
        productId: product.id,
        productType: product.type,
        taxable: product.taxable,
        saveProduct: false,
      },
    ]);
  }

  async function sendEstimate() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail,
        clientName,
        taxPercent,
        expiresInDays,
        clientNote,
        clientTerms: terms,
        privateMemo,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitAmountCents: item.unitCents,
          productId: item.productId,
          productType: item.productType,
          taxable: item.taxable,
          saveProduct: item.saveProduct && !item.productId,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create estimate.");
      return;
    }
    router.push(`/estimates/${data.estimateId}`);
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_24rem] md:px-8 md:py-8 xl:grid-cols-[minmax(0,1fr)_27rem]">
      <section className="rounded-2xl border border-line bg-card p-5 shadow-sm md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted">Estimates</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">New estimate</h1>
          </div>
          <Link href="/estimates" className="text-sm font-medium text-muted hover:text-foreground">
            Close x
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            Client email
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(event) => setClientEmail(event.target.value)}
              placeholder="client@example.com"
              className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="flex flex-col justify-end pb-3">
            {showDetails ? (
              <label className="flex flex-col gap-1.5 text-sm">
                Client name <span className="sr-only">(optional)</span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                  placeholder="Sam Rivera"
                  className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="self-start text-sm font-medium text-accent"
              >
                + Add details
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {recentClients.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Recent clients</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recentClients.map((client) => (
                  <button
                    key={client.clientEmail}
                    type="button"
                    onClick={() => {
                      setClientEmail(client.clientEmail);
                      setClientName(client.clientName ?? "");
                    }}
                    className="flex w-16 flex-shrink-0 flex-col items-center gap-1"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-line bg-card font-display text-sm font-bold">
                      {initials(client.clientName, client.clientEmail)}
                    </span>
                    <span className="w-full truncate text-center text-[11px] text-muted">
                      {client.clientName || client.clientEmail.split("@")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {products.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted">Products and services</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {products.slice(0, 8).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex min-w-36 flex-shrink-0 flex-col rounded-2xl border border-line bg-card p-3 text-left text-foreground hover:border-accent/60"
                  >
                    <span className="truncate text-sm font-semibold">{product.name}</span>
                    <span className="mt-1 text-xs text-muted tabular-nums">
                      {formatCents(product.unitAmount, product.currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Line items</h2>
              <p className="text-sm text-muted">Estimate the products or services being proposed.</p>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems((current) => [...current, blankItem()])}
                className="hidden rounded-full border border-line bg-background px-4 py-2 text-sm font-bold sm:inline-flex"
              >
                + Add item
              </button>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-background">
            <div className="grid grid-cols-[minmax(0,1fr)_5rem_8rem_2.75rem] gap-3 border-b border-line bg-card px-4 py-3 text-xs font-medium text-muted md:grid-cols-[minmax(0,1fr)_6rem_10rem_2.75rem]">
              <span>Description</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            {items.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
                <p className="font-display text-lg font-bold">No items yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Add a service, product, or custom scope line.
                </p>
                <button
                  type="button"
                  onClick={() => setItems([blankItem()])}
                  className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-contrast"
                >
                  + Add item
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_5rem_8rem_2.75rem] gap-3 border-b border-line px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_6rem_10rem_2.75rem]"
                >
                  <div className="min-w-0">
                    <input
                      value={item.description}
                      onChange={(event) =>
                        updateItem(item.id, {
                          description: event.target.value,
                          productId: null,
                          productType: "service",
                        })
                      }
                      placeholder="What are you estimating?"
                      className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <div className="mt-2 flex flex-wrap gap-4">
                      <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                        <input
                          type="checkbox"
                          checked={item.taxable}
                          onChange={(event) => updateItem(item.id, { taxable: event.target.checked })}
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                        Apply tax
                      </label>
                      {!item.productId && item.description.trim().length > 0 && item.unitCents > 0 && (
                        <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                          <input
                            type="checkbox"
                            checked={item.saveProduct}
                            onChange={(event) =>
                              updateItem(item.id, { saveProduct: event.target.checked })
                            }
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          Save as product
                        </label>
                      )}
                    </div>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    aria-label="Quantity"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, {
                        quantity: Math.max(1, Math.round(Number(event.target.value) || 1)),
                      })
                    }
                    className="h-11 rounded-xl border border-line bg-card px-3 text-center text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="flex h-11 items-center rounded-xl border border-line bg-card px-3 focus-within:ring-2 focus-within:ring-accent">
                    <span className="mr-1 text-base text-muted">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      aria-label="Amount"
                      value={item.unitCents === 0 ? "" : (item.unitCents / 100).toString()}
                      onChange={(event) =>
                        updateItem(item.id, {
                          unitCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)),
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-card hover:text-danger"
                    aria-label={`Remove ${item.description || "item"}`}
                  >
                    x
                  </button>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setItems((current) => [...current, blankItem()])}
              className="mt-3 min-h-10 rounded-xl px-1 text-sm font-bold text-accent sm:hidden"
            >
              + Add item
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
          <div className="rounded-2xl border border-line bg-background p-4">
            <h2 className="mb-3 font-display text-xl font-bold">Estimate terms</h2>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted">Valid for</p>
            <div className="flex flex-wrap gap-2">
              {EXPIRY_PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => setExpiresInDays(preset.days)}
                  className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
                    expiresInDays === preset.days
                      ? "border-accent bg-accent text-accent-contrast"
                      : "border-line bg-card text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-background p-4">
            <h2 className="mb-3 font-display text-xl font-bold">Tax</h2>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Tax</span>
              <div className="flex w-24 items-center rounded-xl border border-line bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-accent">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0"
                  value={taxPercent === 0 ? "" : taxPercent.toString()}
                  onChange={(event) =>
                    setTaxPercent(Math.min(100, Math.max(0, Number(event.target.value) || 0)))
                  }
                  className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums focus:outline-none"
                />
                <span className="ml-1 text-muted">%</span>
              </div>
            </label>
          </div>
        </div>

        <details className="mt-4 rounded-2xl border border-line bg-card p-4">
          <summary className="cursor-pointer list-none font-display text-base font-bold">
            Additional details
          </summary>
          <div className="mt-4 grid gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Client note
              <textarea
                value={clientNote}
                onChange={(event) => setClientNote(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Scope notes, next steps, or assumptions."
                className="resize-none rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Terms & Conditions
              <textarea
                value={terms}
                onChange={(event) => setTerms(event.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="Approval terms clients must accept."
                className="resize-none rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Private memo
              <textarea
                value={privateMemo}
                onChange={(event) => setPrivateMemo(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Internal note for your dashboard only."
                className="resize-none rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
        </details>
      </section>

      <aside className="md:sticky md:top-8 md:self-start">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Estimate preview</p>
              <h2 className="font-display text-2xl font-extrabold tabular-nums">
                {formatCents(totalCents)}
              </h2>
            </div>
            <span className="rounded-full bg-line px-3 py-1 text-xs font-medium text-muted">
              {expiresInDays} days
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-background p-5">
            <div className="border-b border-line pb-4">
              <p className="text-xs uppercase tracking-wide text-muted">For</p>
              <p className="mt-1 font-display text-lg font-bold">
                {clientName || clientEmail || "Client"}
              </p>
              <p className="text-sm text-muted">{clientEmail || "client@example.com"}</p>
            </div>
            <div className="mt-4 space-y-3">
              {invoiceRows.length > 0 ? (
                invoiceRows.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.description || "Untitled item"}</p>
                      <p className="text-xs text-muted">Qty {item.quantity}</p>
                    </div>
                    <p className="shrink-0 tabular-nums">
                      {formatCents(item.quantity * item.unitCents)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Line items will appear here.</p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-background p-5 text-sm">
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums">{formatCents(subtotalCents)}</span>
            </div>
            {taxPercent > 0 && (
              <div className="flex justify-between border-t border-line py-1.5">
                <span className="text-muted">Tax ({taxPercent}%)</span>
                <span className="tabular-nums">{formatCents(taxCents)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line py-1.5 font-bold">
              <span>Total estimate</span>
              <span className="tabular-nums">{formatCents(totalCents)}</span>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={!canSend || loading}
            onClick={sendEstimate}
            className="mt-5 w-full rounded-full bg-accent px-5 py-4 font-display font-bold text-accent-contrast disabled:opacity-40"
          >
            {loading ? "Sending..." : "Send estimate"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted">
            The client can accept or decline this estimate before you convert it to an invoice.
          </p>
        </div>
      </aside>
    </main>
  );
}
