"use client";

import { useState } from "react";
import Link from "next/link";
import { Keypad } from "@/components/keypad";
import { formatCents, initials } from "@/lib/format";

const PLATFORM_FEE_PERCENT = 5;
const JOB_PRESETS = ["Service", "Product", "Hourly", "Custom"];
const QUICK_AMOUNTS = [2500, 5000, 10000, 25000, 50000]; // cents
const DUE_PRESETS = [
  { label: "Pay now", days: 0 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
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

type Step = "amount" | "details" | "review" | "sent";

// The keypad drives the first line item. Anything added after it lives here,
// so the one-item fast path never has to touch an array.
type ExtraItem = {
  id: string;
  description: string;
  quantity: number;
  unitCents: number;
  productId: string | null;
  productType: string;
  taxable: boolean;
  saveProduct: boolean;
};

export function NewInvoiceFlow({
  recentClients,
  products,
  prefillClient,
  defaultTermsDays,
  defaultClientTerms,
  defaultClientNote,
}: {
  recentClients: RecentClient[];
  products: SavedProduct[];
  prefillClient?: RecentClient | null;
  defaultTermsDays: number;
  defaultClientTerms: string;
  defaultClientNote: string;
}) {
  const [step, setStep] = useState<Step>("amount");
  const [cents, setCents] = useState(0);
  const [clientEmail, setClientEmail] = useState(prefillClient?.clientEmail ?? "");
  const [clientName, setClientName] = useState(prefillClient?.clientName ?? "");
  const [jobPreset, setJobPreset] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [primaryProductId, setPrimaryProductId] = useState<string | null>(null);
  const [primaryProductType, setPrimaryProductType] = useState("service");
  const [primaryTaxable, setPrimaryTaxable] = useState(true);
  const [savePrimaryProduct, setSavePrimaryProduct] = useState(false);
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [dueInDays, setDueInDays] = useState(defaultTermsDays);
  const [clientNote, setClientNote] = useState(defaultClientNote);
  const [privateMemo, setPrivateMemo] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState(defaultClientTerms);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const extrasCents = extraItems.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
  const subtotalCents = cents + extrasCents;
  const taxableSubtotalCents =
    (primaryTaxable ? cents : 0) +
    extraItems.reduce(
      (sum, item) => sum + (item.taxable ? item.quantity * item.unitCents : 0),
      0
    );
  const taxCents = Math.round(taxableSubtotalCents * (taxPercent / 100));
  const totalCents = subtotalCents + taxCents;
  // Fee is taken on the pre-tax subtotal; tax passes straight through.
  const feeCents = Math.round(subtotalCents * (PLATFORM_FEE_PERCENT / 100));
  const netCents = totalCents - feeCents;
  const extrasComplete = extraItems.every(
    (item) => item.description.trim().length > 0 && item.unitCents > 0 && item.quantity > 0
  );
  const canSend =
    cents > 0 &&
    clientEmail.trim().length > 3 &&
    description.trim().length > 0 &&
    extrasComplete;

  function onKey(key: string) {
    if (key === "⌫") {
      setCents((c) => Math.floor(c / 10));
      return;
    }
    setCents((c) => (c >= 10_000_000 ? c : c * 10 + Number(key)));
  }

  function pickRecentClient(rc: RecentClient) {
    setClientEmail(rc.clientEmail);
    setClientName(rc.clientName ?? "");
  }

  function addExtraItem() {
    setExtraItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unitCents: 0,
        productId: null,
        productType: "service",
        taxable: true,
        saveProduct: false,
      },
    ]);
  }

  function updateExtraItem(id: string, patch: Partial<Omit<ExtraItem, "id">>) {
    setExtraItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeExtraItem(id: string) {
    setExtraItems((items) => items.filter((item) => item.id !== id));
  }

  function pickJob(preset: string) {
    setJobPreset(preset);
    if (preset !== "Custom") setDescription(preset);
    else setDescription("");
    setPrimaryProductId(null);
  }

  function pickPrimaryProduct(product: SavedProduct) {
    setPrimaryProductId(product.id);
    setPrimaryProductType(product.type);
    setPrimaryTaxable(product.taxable);
    setSavePrimaryProduct(false);
    setDescription(product.name);
    setCents(product.unitAmount);
    setJobPreset(null);
  }

  function pickExtraProduct(id: string, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    if (!product) {
      updateExtraItem(id, { productId: null, saveProduct: false });
      return;
    }
    updateExtraItem(id, {
      productId: product.id,
      description: product.name,
      unitCents: product.unitAmount,
      productType: product.type,
      taxable: product.taxable,
      saveProduct: false,
    });
  }

  function resetFlow() {
    setStep("amount");
    setCents(0);
    setClientEmail("");
    setClientName("");
    setJobPreset(null);
    setDescription("");
    setPrimaryProductId(null);
    setPrimaryProductType("service");
    setPrimaryTaxable(true);
    setSavePrimaryProduct(false);
    setExtraItems([]);
    setTaxPercent(0);
    setDueInDays(defaultTermsDays);
    setClientNote(defaultClientNote);
    setPrivateMemo("");
    setInvoiceTerms(defaultClientTerms);
    setShowDetails(false);
    setError(null);
    setSentUrl(null);
    setCopied(false);
  }

  async function send() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientEmail,
        clientName,
        dueInDays,
        taxPercent,
        clientNote,
        privateMemo,
        clientTerms: invoiceTerms,
        items: [
          {
            description,
            quantity: 1,
            unitAmountCents: cents,
            productId: primaryProductId,
            productType: primaryProductType,
            taxable: primaryTaxable,
            saveProduct: savePrimaryProduct && !primaryProductId,
          },
          ...extraItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitAmountCents: item.unitCents,
            productId: item.productId,
            productType: item.productType,
            taxable: item.taxable,
            saveProduct: item.saveProduct && !item.productId,
          })),
        ],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    setSentUrl(data.publicInvoiceUrl ?? data.hostedInvoiceUrl ?? null);
    setStep("sent");
  }

  async function share() {
    if (!sentUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invoice",
          text: `Pay ${formatCents(totalCents)}`,
          url: sentUrl,
        });
      } catch {
        // user cancelled the share sheet — no-op
      }
      return;
    }
    await navigator.clipboard.writeText(sentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const jobChips = (
    <div className="flex gap-2 mb-3 flex-wrap">
      {JOB_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => pickJob(preset)}
          className={`rounded-full px-4 py-2 text-sm font-medium border ${
            jobPreset === preset
              ? "bg-accent text-accent-contrast border-accent"
              : "bg-card text-foreground border-line"
          }`}
        >
          {preset}
        </button>
      ))}
    </div>
  );

  const dueLabel = DUE_PRESETS.find((preset) => preset.days === dueInDays)?.label ?? "Pay now";
  const invoiceRows = [
    { id: "primary", description, quantity: 1, amount: cents },
    ...extraItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      amount: item.quantity * item.unitCents,
    })),
  ].filter((item) => item.description.trim().length > 0 || item.amount > 0);

  const stepIndex = { amount: 0, details: 1, review: 2, sent: 3 }[step];
  const stepProgress = (
    <div className="mb-8 flex gap-1.5" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={3}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i <= stepIndex ? "bg-accent" : "bg-line"
          }`}
        />
      ))}
    </div>
  );

  const quickAmountChips = (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => setCents(amount)}
          className={`flex min-h-11 flex-shrink-0 items-center rounded-full border px-4 text-sm font-medium tabular-nums ${
            cents === amount
              ? "border-accent bg-accent text-accent-contrast"
              : "border-line bg-card text-foreground"
          }`}
        >
          {formatCents(amount)}
        </button>
      ))}
    </div>
  );

  // Payment terms are core to any invoice, so these stay visible. Only the
  // genuinely optional client name hides behind "+ Add details", keeping the
  // common case fast on a phone.
  // The first line item comes from the keypad and the job chips, so it renders
  // as a read-only summary row. Extra items are fully editable.
  const renderItems = (inputBg: string) => (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Line items</p>
      <div className="rounded-2xl border border-line divide-y divide-line mb-2 overflow-hidden">
        {/* The first item is editable in place. The keypad and the job chips
            seed it, but nothing should force a trip back to change a word. */}
        <div className="flex flex-col gap-2 p-3">
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setPrimaryProductId(null);
            }}
            placeholder="What are you billing for?"
            className={`min-w-0 flex-1 rounded-lg border border-line ${inputBg} px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
          />
          <div
            className={`flex min-w-0 items-center rounded-lg border border-line ${inputBg} px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent`}
          >
            <span className="mr-1 text-base text-muted">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={cents === 0 ? "" : (cents / 100).toString()}
              onChange={(e) => setCents(Math.max(0, Math.round(Number(e.target.value || 0) * 100)))}
              className="min-w-0 flex-1 bg-transparent text-base tabular-nums focus:outline-none"
            />
          </div>
          {!primaryProductId && description.trim().length > 0 && cents > 0 && (
            <label className="flex items-center justify-between gap-3 rounded-xl bg-line/35 px-3 py-2 text-sm">
              <span>Save as product for next time</span>
              <input
                type="checkbox"
                checked={savePrimaryProduct}
                onChange={(e) => setSavePrimaryProduct(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
            </label>
          )}
          <label className="flex items-center justify-between gap-3 rounded-xl bg-line/35 px-3 py-2 text-sm">
            <span>Apply tax to this item</span>
            <input
              type="checkbox"
              checked={primaryTaxable}
              onChange={(e) => setPrimaryTaxable(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </label>
        </div>

        {extraItems.map((item) => (
          <div key={item.id} className="flex flex-col gap-2 p-3">
            {products.length > 0 && (
              <select
                value={item.productId ?? ""}
                onChange={(e) => pickExtraProduct(item.id, e.target.value)}
                className={`rounded-lg border border-line ${inputBg} px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
              >
                <option value="">Custom item</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCents(product.unitAmount, product.currency)}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  updateExtraItem(item.id, { description: e.target.value, productId: null })
                }
                placeholder="Description"
                className={`min-w-0 flex-1 rounded-lg border border-line ${inputBg} px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
              />
              <button
                type="button"
                onClick={() => removeExtraItem(item.id)}
                aria-label={`Remove ${item.description || "item"}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-muted">
                Qty
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateExtraItem(item.id, {
                      quantity: Math.max(1, Math.round(Number(e.target.value) || 1)),
                    })
                  }
                  className={`w-16 rounded-lg border border-line ${inputBg} px-2 py-2.5 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-accent`}
                />
              </label>
              <div
                className={`flex min-w-0 flex-1 items-center rounded-lg border border-line ${inputBg} px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent`}
              >
                <span className="mr-1 text-base text-muted">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.unitCents === 0 ? "" : (item.unitCents / 100).toString()}
                  onChange={(e) =>
                    updateExtraItem(item.id, {
                      unitCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                    })
                  }
                  className="min-w-0 flex-1 bg-transparent text-base tabular-nums focus:outline-none"
                />
              </div>
              <span className="hidden w-20 shrink-0 text-right text-sm tabular-nums sm:block">
                {formatCents(item.quantity * item.unitCents)}
              </span>
            </div>
            {!item.productId && item.description.trim().length > 0 && item.unitCents > 0 && (
              <label className="flex items-center justify-between gap-3 rounded-xl bg-line/35 px-3 py-2 text-sm">
                <span>Save as product for next time</span>
                <input
                  type="checkbox"
                  checked={item.saveProduct}
                  onChange={(e) => updateExtraItem(item.id, { saveProduct: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>
            )}
            <label className="flex items-center justify-between gap-3 rounded-xl bg-line/35 px-3 py-2 text-sm">
              <span>Apply tax to this item</span>
              <input
                type="checkbox"
                checked={item.taxable}
                onChange={(e) => updateExtraItem(item.id, { taxable: e.target.checked })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
            </label>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addExtraItem}
        className="min-h-11 px-1 text-sm font-medium text-accent"
      >
        + Add item
      </button>
    </div>
  );

  const desktopItems = (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-background">
        <div className="grid grid-cols-[minmax(0,1fr)_5rem_8rem_2.75rem] gap-3 border-b border-line bg-card px-4 py-3 text-xs font-medium text-muted">
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Amount</span>
          <span />
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_5rem_8rem_2.75rem] gap-3 border-b border-line px-4 py-4">
          <div className="min-w-0">
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setPrimaryProductId(null);
              }}
              placeholder="What are you billing for?"
              className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {!primaryProductId && description.trim().length > 0 && cents > 0 && (
              <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={savePrimaryProduct}
                  onChange={(e) => setSavePrimaryProduct(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Save as product
              </label>
            )}
            <label className="mt-2 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={primaryTaxable}
                onChange={(e) => setPrimaryTaxable(e.target.checked)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Apply tax
            </label>
          </div>
          <div className="flex h-11 items-center justify-center rounded-xl border border-line bg-card text-base tabular-nums text-muted">
            1
          </div>
          <div className="flex h-11 items-center rounded-xl border border-line bg-card px-3 focus-within:ring-2 focus-within:ring-accent">
            <span className="mr-1 text-base text-muted">$</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={cents === 0 ? "" : (cents / 100).toString()}
              onChange={(e) => setCents(Math.max(0, Math.round(Number(e.target.value || 0) * 100)))}
              className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums focus:outline-none"
            />
          </div>
          <span />
        </div>

        {extraItems.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[minmax(0,1fr)_5rem_8rem_2.75rem] gap-3 border-b border-line px-4 py-4 last:border-b-0"
          >
            <div className="min-w-0">
              {products.length > 0 && (
                <select
                  value={item.productId ?? ""}
                  onChange={(e) => pickExtraProduct(item.id, e.target.value)}
                  className="mb-2 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Custom item</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCents(product.unitAmount, product.currency)}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={item.description}
                onChange={(e) =>
                  updateExtraItem(item.id, { description: e.target.value, productId: null })
                }
                placeholder="Description"
                className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {!item.productId && item.description.trim().length > 0 && item.unitCents > 0 && (
                <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={item.saveProduct}
                    onChange={(e) => updateExtraItem(item.id, { saveProduct: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                  Save as product
                </label>
              )}
              <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={item.taxable}
                  onChange={(e) => updateExtraItem(item.id, { taxable: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Apply tax
              </label>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              value={item.quantity}
              onChange={(e) =>
                updateExtraItem(item.id, {
                  quantity: Math.max(1, Math.round(Number(e.target.value) || 1)),
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
                value={item.unitCents === 0 ? "" : (item.unitCents / 100).toString()}
                onChange={(e) =>
                  updateExtraItem(item.id, {
                    unitCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                  })
                }
                className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => removeExtraItem(item.id)}
              aria-label={`Remove ${item.description || "item"}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-card hover:text-danger"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addExtraItem}
        className="mt-3 min-h-10 rounded-xl px-1 text-sm font-bold text-accent"
      >
        + Add line item
      </button>
    </div>
  );

  const renderTaxRow = (inputBg: string) => (
    <label className="mb-4 flex items-center justify-between gap-3 text-sm">
      <span>Tax</span>
      <div
        className={`flex w-24 items-center rounded-xl border border-line ${inputBg} px-3 py-2 focus-within:ring-2 focus-within:ring-accent`}
      >
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max="100"
          step="0.01"
          placeholder="0"
          value={taxPercent === 0 ? "" : taxPercent.toString()}
          onChange={(e) =>
            setTaxPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
          }
          className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums focus:outline-none"
        />
        <span className="ml-1 text-muted">%</span>
      </div>
    </label>
  );

  const dueChips = (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Payment due</p>
      <div className="flex gap-2 flex-wrap">
        {DUE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => setDueInDays(preset.days)}
            className={`rounded-full px-4 py-2 text-sm font-medium border ${
              dueInDays === preset.days
                ? "bg-accent text-accent-contrast border-accent"
                : "bg-card text-foreground border-line"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderDetails = (inputBg: string) =>
    showDetails ? (
      <label className="flex flex-col gap-1.5 text-sm mb-4">
        <span>
          Client name <span className="text-muted">(optional)</span>
        </span>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Sam Rivera"
          className={`rounded-xl border border-line ${inputBg} px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
        />
      </label>
    ) : (
      <button
        type="button"
        onClick={() => setShowDetails(true)}
        className="text-sm font-medium text-accent mb-4 self-start"
      >
        + Add details
      </button>
    );

  const renderAdditionalDetails = (inputBg: string) => (
    <details className="mb-4 rounded-2xl border border-line bg-card p-4">
      <summary className="cursor-pointer list-none font-display text-base font-bold">
        Additional details
      </summary>
      <div className="mt-4 grid gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Client note
          <textarea
            value={clientNote}
            onChange={(e) => setClientNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Thank your client or add payment instructions."
            className={`resize-none rounded-xl border border-line ${inputBg} px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
          />
          <span className="text-xs text-muted">Shown on the branded invoice page and email.</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Terms & Conditions
          <textarea
            value={invoiceTerms}
            onChange={(e) => setInvoiceTerms(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Agreement clients must accept before paying."
            className={`resize-none rounded-xl border border-line ${inputBg} px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
          />
          <span className="text-xs text-muted">
            Clients must agree before opening the secure Stripe payment page.
          </span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Private memo
          <textarea
            value={privateMemo}
            onChange={(e) => setPrivateMemo(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Internal note for your dashboard only."
            className={`resize-none rounded-xl border border-line ${inputBg} px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
          />
          <span className="text-xs text-muted">Not shown to the client.</span>
        </label>
      </div>
    </details>
  );

  const recentClientChips = recentClients.length > 0 && (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Send again to</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recentClients.map((rc) => (
          <button
            key={rc.clientEmail}
            type="button"
            onClick={() => pickRecentClient(rc)}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-16"
          >
            <span
              className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-sm border-2 ${
                clientEmail === rc.clientEmail
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-line bg-card text-foreground"
              }`}
            >
              {initials(rc.clientName, rc.clientEmail)}
            </span>
            <span className="text-[11px] text-muted truncate w-full text-center">
              {rc.clientName || rc.clientEmail.split("@")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const productChips = products.length > 0 && (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-wide text-muted mb-2">Products and services</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {products.slice(0, 8).map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => pickPrimaryProduct(product)}
            className={`flex min-w-36 flex-shrink-0 flex-col rounded-2xl border p-3 text-left ${
              primaryProductId === product.id
                ? "border-accent bg-accent text-accent-contrast"
                : "border-line bg-card text-foreground"
            }`}
          >
            <span className="truncate text-sm font-semibold">{product.name}</span>
            <span
              className={`mt-1 text-xs tabular-nums ${
                primaryProductId === product.id ? "text-accent-contrast/80" : "text-muted"
              }`}
            >
              {formatCents(product.unitAmount, product.currency)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const totalsRows = (
    <>
      <div className="flex justify-between text-sm py-1.5">
        <span className="text-muted">Subtotal</span>
        <span className="tabular-nums">{formatCents(subtotalCents)}</span>
      </div>
      {taxPercent > 0 && (
        <div className="flex justify-between text-sm py-1.5 border-t border-line">
          <span className="text-muted">Tax ({taxPercent}%)</span>
          <span className="tabular-nums">{formatCents(taxCents)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm py-1.5 border-t border-line font-medium">
        <span>Total</span>
        <span className="font-display font-bold tabular-nums">{formatCents(totalCents)}</span>
      </div>
      <div className="flex justify-between text-sm py-1.5 border-t border-line">
        <span className="text-muted">Platform fee ({PLATFORM_FEE_PERCENT}%)</span>
        <span className="tabular-nums">{formatCents(feeCents)}</span>
      </div>
      <div className="flex justify-between text-sm py-1.5 border-t border-line font-medium">
        <span>You get</span>
        <span className="tabular-nums text-success">{formatCents(netCents)}</span>
      </div>
    </>
  );

  const feeBreakdown = (
    <div className="rounded-2xl border border-line bg-card p-5">{totalsRows}</div>
  );

  const sentView = (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="font-display text-2xl font-extrabold mb-1">Invoice sent</h1>
      <p className="text-sm text-muted mb-8">
        {formatCents(totalCents)} to {clientEmail}. They&apos;ll get an email — or share the link
        directly right now.
      </p>

      <button
        type="button"
        onClick={share}
        className="w-full rounded-full bg-accent text-accent-contrast font-display font-bold py-4 mb-3"
      >
        {copied ? "Link copied ✓" : "Share invoice link"}
      </button>
      <button
        type="button"
        onClick={resetFlow}
        className="w-full rounded-full border border-line font-medium py-4 mb-3"
      >
        Send another
      </button>
      <Link href="/dashboard" className="text-sm text-muted mt-2">
        Back to dashboard
      </Link>
    </div>
  );

  return (
    <>
      {/* ---------- Mobile: keypad-first step flow ---------- */}
      <main className="md:hidden flex-1 flex flex-col px-6 py-8 max-w-md mx-auto w-full">
        {step === "amount" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="text-sm text-muted">
                Cancel
              </Link>
              <p className="text-sm text-muted">Amount</p>
            </div>
            {stepProgress}
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <p className="font-display text-6xl font-extrabold tabular-nums tracking-tight">
                {formatCents(cents)}
              </p>
              {quickAmountChips}
            </div>
            <Keypad onKey={onKey} />
            <button
              type="button"
              disabled={cents === 0}
              onClick={() => setStep("details")}
              className="mt-8 rounded-full bg-accent text-accent-contrast font-display font-bold py-4 disabled:opacity-40"
            >
              Next
            </button>
          </>
        )}

        {step === "details" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setStep("amount")} className="text-sm text-muted">
                ← Back
              </button>
              <p className="text-sm text-muted">Details</p>
            </div>
            {stepProgress}
            <p className="font-display text-3xl font-extrabold tabular-nums mb-6">
              {formatCents(totalCents)}
            </p>
            {recentClientChips}
            {productChips}
            <label className="flex flex-col gap-1.5 text-sm mb-4">
              Client email
              <input
                type="email"
                required
                inputMode="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="rounded-xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <p className="text-xs uppercase tracking-wide text-muted mb-2">What&apos;s this for?</p>
            {jobChips}
            {jobPreset === "Custom" && (
              <input
                type="text"
                autoFocus
                placeholder="What are you billing for?"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setPrimaryProductId(null);
                }}
                className="rounded-xl border border-line bg-card px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
            {renderItems("bg-card")}
            {renderTaxRow("bg-card")}
            {dueChips}
            {renderDetails("bg-card")}
            {renderAdditionalDetails("bg-card")}
            <div className="flex-1" />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => setStep("review")}
              className="mt-6 rounded-full bg-accent text-accent-contrast font-display font-bold py-4 disabled:opacity-40"
            >
              Review
            </button>
          </>
        )}

        {step === "review" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setStep("details")} className="text-sm text-muted">
                ← Back
              </button>
              <p className="text-sm text-muted">Review</p>
            </div>
            {stepProgress}
            <div className="elevated rounded-2xl border border-line bg-card p-6 mb-6" style={{ borderStyle: "dashed" }}>
              <p className="text-xs uppercase tracking-wide text-muted mb-1">{description}</p>
              <p className="font-display text-4xl font-extrabold tabular-nums mb-4">
                {formatCents(totalCents)}
              </p>

              {extraItems.length > 0 && (
                <div className="mb-2 border-t border-line pt-2">
                  <div className="flex justify-between py-1 text-sm">
                    <span className="text-muted truncate">{description}</span>
                    <span className="tabular-nums">{formatCents(cents)}</span>
                  </div>
                  {extraItems.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 text-sm">
                      <span className="text-muted truncate">
                        {item.description}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </span>
                      <span className="tabular-nums">
                        {formatCents(item.quantity * item.unitCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between text-sm py-2 border-t border-line">
                <span className="text-muted">To</span>
                <span className="font-medium">{clientName || clientEmail}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-t border-line">
                <span className="text-muted">Due</span>
                <span>{dueLabel}</span>
              </div>
              <div className="border-t border-line pt-1">{totalsRows}</div>
            </div>
            {error && <p className="text-sm text-danger mb-4">{error}</p>}
            <div className="flex-1" />
            <button
              type="button"
              disabled={loading}
              onClick={send}
              className="rounded-full bg-accent text-accent-contrast font-display font-bold py-4 disabled:opacity-60"
            >
              {loading ? "Sending…" : `Send invoice for ${formatCents(totalCents)}`}
            </button>
          </>
        )}

        {step === "sent" && <div className="flex-1 flex flex-col justify-center">{sentView}</div>}
      </main>

      {/* ---------- Desktop: full invoice workspace ---------- */}
      <div className="hidden flex-1 px-8 py-8 md:block">
        <div className="mx-auto w-full max-w-7xl">
          {step !== "sent" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
              <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted">Invoices</p>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight">
                      New invoice
                    </h1>
                  </div>
                  <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-foreground">
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
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </label>
                  <div className="flex flex-col">{renderDetails("bg-background")}</div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {recentClientChips && <div className="min-w-0">{recentClientChips}</div>}
                  {productChips && <div className="min-w-0">{productChips}</div>}
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold">Line items</h2>
                      <p className="text-sm text-muted">
                        Add the products or services being billed.
                      </p>
                    </div>
                    <div className="hidden shrink-0 sm:block">{jobChips}</div>
                  </div>
                  <div className="sm:hidden">{jobChips}</div>
                  {desktopItems}
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <h2 className="mb-3 font-display text-xl font-bold">Payment terms</h2>
                    {dueChips}
                  </div>
                  <div>
                    <h2 className="mb-3 font-display text-xl font-bold">Tax</h2>
                    {renderTaxRow("bg-background")}
                  </div>
                </div>
                <div className="mt-2">{renderAdditionalDetails("bg-background")}</div>
              </section>

              <aside className="lg:sticky lg:top-8 lg:self-start">
                <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted">Invoice preview</p>
                      <h2 className="font-display text-2xl font-extrabold tabular-nums">
                        {formatCents(totalCents)}
                      </h2>
                    </div>
                    <span className="rounded-full bg-line px-3 py-1 text-xs font-medium text-muted">
                      {dueLabel}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-line bg-background p-5">
                    <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted">Bill to</p>
                        <p className="mt-1 font-display text-lg font-bold">
                          {clientName || clientEmail || "Client"}
                        </p>
                        <p className="text-sm text-muted">
                          {clientEmail || "client@example.com"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {invoiceRows.length > 0 ? (
                        invoiceRows.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {item.description || "Untitled item"}
                              </p>
                              <p className="text-xs text-muted">Qty {item.quantity}</p>
                            </div>
                            <p className="shrink-0 tabular-nums">{formatCents(item.amount)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted">Line items will appear here.</p>
                      )}
                    </div>

                    {clientNote.trim().length > 0 && (
                      <p className="mt-4 rounded-xl bg-card p-3 text-sm leading-relaxed text-muted">
                        {clientNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-line bg-background p-5">
                    {totalsRows}
                  </div>

                  {error && <p className="mt-4 text-sm text-danger">{error}</p>}

                  <button
                    type="button"
                    disabled={!canSend || loading}
                    onClick={send}
                    className="mt-5 w-full rounded-full bg-accent px-5 py-4 font-display font-bold text-accent-contrast disabled:opacity-40"
                  >
                    {loading
                      ? "Sending..."
                      : cents > 0
                        ? `Send invoice for ${formatCents(totalCents)}`
                        : "Send invoice"}
                  </button>

                  <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                    Secure payment processed by iDesignLC Agency in partnership with Stripe.
                  </p>
                </div>
              </aside>
            </div>
          ) : (
            <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center rounded-2xl border border-line bg-card p-8">
              {sentView}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Desktop: single-view card ---------- */}
      <div className="hidden">
        <div className="w-full max-w-md rounded-3xl border border-line bg-card p-8">
          {step !== "sent" ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-display text-xl font-bold">New invoice</h1>
                <Link href="/dashboard" className="text-muted hover:text-foreground text-sm">
                  Close ✕
                </Link>
              </div>

              <label className="flex flex-col gap-1.5 text-sm mb-5">
                Amount
                <div className="flex items-center rounded-xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
                  <span className="text-muted mr-1 font-display font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={cents === 0 ? "" : (cents / 100).toString()}
                    onChange={(e) =>
                      setCents(Math.max(0, Math.round(Number(e.target.value || 0) * 100)))
                    }
                    className="flex-1 bg-transparent text-base font-display font-bold tabular-nums focus:outline-none"
                  />
                </div>
              </label>

              {recentClientChips}
              {productChips}

              <label className="flex flex-col gap-1.5 text-sm mb-4">
                Client email
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>

              <p className="text-xs uppercase tracking-wide text-muted mb-2">What&apos;s this for?</p>
              {jobChips}
              {jobPreset === "Custom" && (
                <input
                  type="text"
                  placeholder="What are you billing for?"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setPrimaryProductId(null);
                  }}
                  className="rounded-xl border border-line bg-background px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}

              {renderItems("bg-background")}
              {renderTaxRow("bg-background")}
              {dueChips}
              <div className="flex flex-col">{renderDetails("bg-background")}</div>

              <div className="my-5">{feeBreakdown}</div>

              {error && <p className="text-sm text-danger mb-4">{error}</p>}

              <button
                type="button"
                disabled={!canSend || loading}
                onClick={send}
                className="w-full rounded-full bg-accent text-accent-contrast font-display font-bold py-3.5 disabled:opacity-40"
              >
                {loading
                  ? "Sending…"
                  : cents > 0
                    ? `Send invoice for ${formatCents(totalCents)}`
                    : "Send invoice"}
              </button>
            </>
          ) : (
            sentView
          )}
        </div>
      </div>
    </>
  );
}
