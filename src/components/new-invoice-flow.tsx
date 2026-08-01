"use client";

import { useState } from "react";
import Link from "next/link";
import { Keypad } from "@/components/keypad";
import { formatCents, initials } from "@/lib/format";
import { PLATFORM_FEE_PERCENT, PLATFORM_FEE_FLAT_CENTS, calculateFeeAmount } from "@/lib/fees";
import { generateTypedSignatureDataUrl } from "@/lib/signature";

const QUICK_AMOUNTS = [2500, 5000, 10000, 25000, 50000];
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

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitCents: number;
  productId: string | null;
  productType: string;
  taxable: boolean;
  saveProduct: boolean;
};

type Step = "amount" | "details" | "review" | "sent";

type InitialEstimate = {
  id: string;
  clientEmail: string;
  clientName: string | null;
  taxPercent: number;
  dueInDays: number;
  clientNote: string;
  clientTerms: string;
  privateMemo: string;
  items: InvoiceItem[];
};

function createBlankItem(unitCents = 0): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitCents,
    productId: null,
    productType: "service",
    taxable: true,
    saveProduct: false,
  };
}

export function NewInvoiceFlow({
  recentClients,
  products,
  prefillClient,
  initialEstimate,
  defaultTermsDays,
  defaultClientTerms,
  defaultClientNote,
  projects = [],
}: {
  recentClients: RecentClient[];
  products: SavedProduct[];
  prefillClient?: RecentClient | null;
  initialEstimate?: InitialEstimate | null;
  defaultTermsDays: number;
  defaultClientTerms: string;
  defaultClientNote: string;
  projects?: { id: string; name: string }[];
}) {
  const [step, setStep] = useState<Step>(initialEstimate ? "details" : "amount");
  const [mobileAmountCents, setMobileAmountCents] = useState(0);
  const [clientEmail, setClientEmail] = useState(
    initialEstimate?.clientEmail ?? prefillClient?.clientEmail ?? ""
  );
  const [clientName, setClientName] = useState(
    initialEstimate?.clientName ?? prefillClient?.clientName ?? ""
  );
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>(initialEstimate?.items ?? []);
  const [taxPercent, setTaxPercent] = useState(initialEstimate?.taxPercent ?? 0);
  const [dueInDays, setDueInDays] = useState(initialEstimate?.dueInDays ?? defaultTermsDays);
  const [clientNote, setClientNote] = useState(initialEstimate?.clientNote ?? defaultClientNote);
  const [privateMemo, setPrivateMemo] = useState(initialEstimate?.privateMemo ?? "");
  const [projectId, setProjectId] = useState("");
  const [invoiceTerms, setInvoiceTerms] = useState(
    initialEstimate?.clientTerms ?? defaultClientTerms
  );
  const [requireSignature, setRequireSignature] = useState(false);
  const [senderSignerName, setSenderSignerName] = useState("");
  const [senderSignatureData, setSenderSignatureData] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(Boolean(initialEstimate?.clientName));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.unitCents, 0);
  const taxableSubtotalCents = items.reduce(
    (sum, item) => sum + (item.taxable ? item.quantity * item.unitCents : 0),
    0
  );
  const taxCents = Math.round(taxableSubtotalCents * (taxPercent / 100));
  const totalCents = subtotalCents + taxCents;
  const feeCents = calculateFeeAmount(subtotalCents);
  const netCents = totalCents - feeCents;
  const dueLabel = DUE_PRESETS.find((preset) => preset.days === dueInDays)?.label ?? "Pay now";
  const hasValidItems = items.some(
    (item) => item.description.trim().length > 0 && item.unitCents > 0 && item.quantity > 0
  );
  const allItemsComplete =
    items.length > 0 &&
    items.every(
      (item) => item.description.trim().length > 0 && item.unitCents > 0 && item.quantity > 0
    );
  const canSend =
    clientEmail.trim().length > 3 &&
    hasValidItems &&
    allItemsComplete &&
    (!requireSignature || Boolean(senderSignatureData && senderSignerName.trim()));
  const invoiceRows = items
    .filter((item) => item.description.trim().length > 0 || item.unitCents > 0)
    .map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      amount: item.quantity * item.unitCents,
    }));
  const firstDescription = invoiceRows[0]?.description || "Invoice";

  function onKey(key: string) {
    if (!/^\d$/.test(key)) {
      setMobileAmountCents((cents) => Math.floor(cents / 10));
      return;
    }
    setMobileAmountCents((cents) => (cents >= 10_000_000 ? cents : cents * 10 + Number(key)));
  }

  function pickRecentClient(rc: RecentClient) {
    setClientEmail(rc.clientEmail);
    setClientName(rc.clientName ?? "");
  }

  function addItem(unitCents = 0) {
    setItems((currentItems) => [...currentItems, createBlankItem(unitCents)]);
  }

  function addProductItem(product: SavedProduct) {
    setItems((currentItems) => [
      ...currentItems,
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

  function updateItem(id: string, patch: Partial<Omit<InvoiceItem, "id">>) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeItem(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function continueFromMobileAmount() {
    setItems((currentItems) => {
      if (currentItems.length === 0) return [createBlankItem(mobileAmountCents)];
      if (
        currentItems.length === 1 &&
        currentItems[0].description.trim().length === 0 &&
        currentItems[0].productId === null
      ) {
        return [{ ...currentItems[0], unitCents: mobileAmountCents }];
      }
      return currentItems;
    });
    setStep("details");
  }

  function resetFlow() {
    setStep("amount");
    setMobileAmountCents(0);
    setClientEmail("");
    setClientName("");
    setCcEmails("");
    setBccEmails("");
    setItems([]);
    setTaxPercent(0);
    setDueInDays(defaultTermsDays);
    setClientNote(defaultClientNote);
    setPrivateMemo("");
    setProjectId("");
    setInvoiceTerms(defaultClientTerms);
    setRequireSignature(false);
    setSenderSignerName("");
    setSenderSignatureData(null);
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
        ccEmails,
        bccEmails,
        dueInDays,
        taxPercent,
        clientNote,
        privateMemo,
        projectId: projectId || undefined,
        clientTerms: invoiceTerms,
        requireSignature,
        senderSignerName,
        senderSignatureData,
        estimateId: initialEstimate?.id,
        deliveryMode: "branded_email",
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
        // User cancelled the share sheet.
      }
      return;
    }
    await navigator.clipboard.writeText(sentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepIndex = { amount: 0, details: 1, review: 2, sent: 3 }[step];
  const stepProgress = (
    <div
      className="mb-8 flex gap-1.5"
      role="progressbar"
      aria-valuenow={stepIndex + 1}
      aria-valuemin={1}
      aria-valuemax={3}
    >
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
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scroll-fade-x">
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => setMobileAmountCents(amount)}
          className={`flex min-h-11 flex-shrink-0 items-center rounded-full border px-4 text-sm font-medium tabular-nums ${
            mobileAmountCents === amount
              ? "border-accent bg-accent text-accent-contrast"
              : "border-line bg-card text-foreground"
          }`}
        >
          {formatCents(amount)}
        </button>
      ))}
    </div>
  );

  const recentClientChips = recentClients.length > 0 && (
    <div className="mb-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Send again to</p>
      <div className="flex gap-3 overflow-x-auto pb-1 scroll-fade-x">
        {recentClients.map((rc) => (
          <button
            key={rc.clientEmail}
            type="button"
            onClick={() => pickRecentClient(rc)}
            className="flex w-16 flex-shrink-0 flex-col items-center gap-1"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-display text-sm font-bold ${
                clientEmail === rc.clientEmail
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-line bg-card text-foreground"
              }`}
            >
              {initials(rc.clientName, rc.clientEmail)}
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted">
              {rc.clientName || rc.clientEmail.split("@")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  const productChips = products.length > 0 && (
    <div className="mb-4">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Products and services</p>
      <div className="flex gap-3 overflow-x-auto pb-1 scroll-fade-x">
        {products.slice(0, 8).map((product) => {
          const isAdded = items.some((item) => item.productId === product.id);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => addProductItem(product)}
              className={`flex min-w-36 flex-shrink-0 flex-col rounded-2xl border p-3 text-left transition-colors ${
                isAdded
                  ? "border-accent bg-accent text-accent-contrast"
                  : "border-line bg-card text-foreground hover:border-accent/60"
              }`}
            >
              <span className="truncate text-sm font-semibold">{product.name}</span>
              <span
                className={`mt-1 text-xs tabular-nums ${
                  isAdded ? "text-accent-contrast/80" : "text-muted"
                }`}
              >
                {formatCents(product.unitAmount, product.currency)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderTaxRow = (inputBg: string) => (
    <label className="flex items-center justify-between gap-3 text-sm">
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
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-muted">Payment due</p>
      <div className="flex flex-wrap gap-2">
        {DUE_PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => setDueInDays(preset.days)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium ${
              dueInDays === preset.days
                ? "border-accent bg-accent text-accent-contrast"
                : "border-line bg-card text-foreground"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );

  const emailCopyFields = (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm">
        CC <span className="text-muted">(optional)</span>
        <input
          type="text"
          inputMode="email"
          value={ccEmails}
          onChange={(e) => setCcEmails(e.target.value)}
          placeholder="accounting@example.com, manager@example.com"
          className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        BCC <span className="text-muted">(optional)</span>
        <input
          type="text"
          inputMode="email"
          value={bccEmails}
          onChange={(e) => setBccEmails(e.target.value)}
          placeholder="records@example.com"
          className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <p className="text-xs text-muted md:col-span-2">
        Separate multiple emails with commas. CC is visible to recipients; BCC stays private.
      </p>
    </div>
  );

  const renderClientName = (inputBg: string) =>
    showDetails ? (
      <label className="flex flex-col gap-1.5 text-sm">
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
        className="self-start text-sm font-medium text-accent"
      >
        + Add details
      </button>
    );

  const renderAdditionalDetails = (inputBg: string) => (
    <details className="rounded-2xl border border-line bg-card p-4">
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

        {invoiceTerms.trim().length > 0 && (
          <div className="rounded-xl border border-line bg-card p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={requireSignature}
                onChange={(e) => {
                  setRequireSignature(e.target.checked);
                  if (!e.target.checked) {
                    setSenderSignatureData(null);
                    setSenderSignerName("");
                  }
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span>
                <span className="block font-medium text-foreground">
                  Require an electronic signature
                </span>
                <span className="text-xs text-muted">
                  The client signs the contract terms above (typed or drawn) before they can pay,
                  instead of just checking a box.
                </span>
              </span>
            </label>

            {requireSignature && (
              <div className="mt-4 rounded-xl border border-line bg-background p-4">
                <p className="text-xs uppercase tracking-wide text-muted">Your signature</p>
                <p className="mt-1 text-xs text-muted">
                  Sign first as the party sending this contract — the client signs when they
                  receive it.
                </p>
                {senderSignatureData ? (
                  <div className="mt-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={senderSignatureData}
                      alt="Your signature"
                      className="h-14 max-w-[200px] rounded-lg border border-line bg-white object-contain p-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{senderSignerName}</p>
                      <button
                        type="button"
                        onClick={() => setSenderSignatureData(null)}
                        className="text-xs text-danger"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={senderSignerName}
                      onChange={(e) => setSenderSignerName(e.target.value)}
                      placeholder="Type your full name to sign"
                      className="flex-1 rounded-xl border border-line bg-card px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="button"
                      disabled={!senderSignerName.trim()}
                      onClick={() => setSenderSignatureData(generateTypedSignatureDataUrl(senderSignerName))}
                      className="rounded-xl border border-line px-4 py-3 text-sm font-bold disabled:opacity-40"
                    >
                      Apply signature
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

        {projects.length > 0 && (
          <label className="flex flex-col gap-1.5 text-sm">
            Project <span className="text-muted">(optional)</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={`rounded-xl border border-line ${inputBg} px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </details>
  );

  const renderMobileItems = (inputBg: string) => (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-muted">Line items</p>
        <button type="button" onClick={() => addItem()} className="text-sm font-bold text-accent">
          + Add item
        </button>
      </div>
      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => addItem()}
          className="flex min-h-24 w-full flex-col items-start justify-center rounded-2xl border border-dashed border-line p-4 text-left"
        >
          <span className="font-display text-base font-bold">Add your first item</span>
          <span className="mt-1 text-sm text-muted">Description, quantity, amount, and tax.</span>
        </button>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, {
                      description: e.target.value,
                      productId: null,
                      productType: "service",
                    })
                  }
                  placeholder="Description"
                  className={`min-w-0 flex-1 rounded-lg border border-line ${inputBg} px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.description || "item"}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger"
                >
                  x
                </button>
              </div>
              <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Qty
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, {
                        quantity: Math.max(1, Math.round(Number(e.target.value) || 1)),
                      })
                    }
                    className={`rounded-lg border border-line ${inputBg} px-2 py-2.5 text-center text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-accent`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-muted">
                  Amount
                  <div
                    className={`flex items-center rounded-lg border border-line ${inputBg} px-3 py-2.5 focus-within:ring-2 focus-within:ring-accent`}
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
                        updateItem(item.id, {
                          unitCents: Math.max(
                            0,
                            Math.round(Number(e.target.value || 0) * 100)
                          ),
                        })
                      }
                      className="min-w-0 flex-1 bg-transparent text-base tabular-nums focus:outline-none"
                    />
                  </div>
                </label>
              </div>
              {!item.productId && item.description.trim().length > 0 && item.unitCents > 0 && (
                <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-line/35 px-3 text-sm">
                  <span>Save as product for next time</span>
                  <input
                    type="checkbox"
                    checked={item.saveProduct}
                    onChange={(e) => updateItem(item.id, { saveProduct: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </label>
              )}
              <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-line/35 px-3 text-sm">
                <span>Apply tax to this item</span>
                <input
                  type="checkbox"
                  checked={item.taxable}
                  onChange={(e) => updateItem(item.id, { taxable: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const desktopItems = (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-background">
        <div className="grid grid-cols-[minmax(0,1fr)_6rem_10rem_2.75rem] gap-3 border-b border-line bg-card px-4 py-3 text-xs font-medium text-muted">
          <span>Description</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        {items.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center px-5 py-8 text-center">
            <p className="font-display text-lg font-bold">No items yet</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Start with Add item, then enter the description, quantity, and amount.
            </p>
            <button
              type="button"
              onClick={() => addItem()}
              className="mt-4 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-contrast"
            >
              + Add item
            </button>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_6rem_10rem_2.75rem] gap-3 border-b border-line px-4 py-4 last:border-b-0"
            >
              <div className="min-w-0">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, {
                      description: e.target.value,
                      productId: null,
                      productType: "service",
                    })
                  }
                  placeholder="What are you billing for?"
                  className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={item.taxable}
                      onChange={(e) => updateItem(item.id, { taxable: e.target.checked })}
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    Apply tax
                  </label>
                  {!item.productId && item.description.trim().length > 0 && item.unitCents > 0 && (
                    <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
                      <input
                        type="checkbox"
                        checked={item.saveProduct}
                        onChange={(e) => updateItem(item.id, { saveProduct: e.target.checked })}
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
                onChange={(e) =>
                  updateItem(item.id, {
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
                  aria-label="Amount"
                  value={item.unitCents === 0 ? "" : (item.unitCents / 100).toString()}
                  onChange={(e) =>
                    updateItem(item.id, {
                      unitCents: Math.max(0, Math.round(Number(e.target.value || 0) * 100)),
                    })
                  }
                  className="min-w-0 flex-1 bg-transparent text-right text-base tabular-nums focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.description || "item"}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-card hover:text-danger"
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
          onClick={() => addItem()}
          className="mt-3 min-h-10 rounded-xl px-1 text-sm font-bold text-accent"
        >
          + Add item
        </button>
      )}
    </div>
  );

  const totalsRows = (
    <>
      <div className="flex justify-between py-1.5 text-sm">
        <span className="text-muted">Subtotal</span>
        <span className="tabular-nums">{formatCents(subtotalCents)}</span>
      </div>
      {taxPercent > 0 && (
        <div className="flex justify-between border-t border-line py-1.5 text-sm">
          <span className="text-muted">Tax ({taxPercent}%)</span>
          <span className="tabular-nums">{formatCents(taxCents)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-line py-1.5 text-sm font-medium">
        <span>Total</span>
        <span className="font-display font-bold tabular-nums">{formatCents(totalCents)}</span>
      </div>
      <div className="flex justify-between border-t border-line py-1.5 text-sm">
        <span className="text-muted">
          Platform fee ({PLATFORM_FEE_PERCENT}% + {formatCents(PLATFORM_FEE_FLAT_CENTS)})
        </span>
        <span className="tabular-nums">{formatCents(feeCents)}</span>
      </div>
      <div className="flex justify-between border-t border-line py-1.5 text-sm font-medium">
        <span>You get</span>
        <span className="tabular-nums text-success">{formatCents(netCents)}</span>
      </div>
    </>
  );

  const sentView = (
    <div className="flex flex-col items-center text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h1 className="mb-1 font-display text-2xl font-extrabold">Invoice sent successfully</h1>
      <p className="mb-2 text-sm text-muted">
        {formatCents(totalCents)} invoice for {clientEmail}.
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted">
        We created the secure payment page and sent the invoice email. You can also share the link
        directly with your client.
      </p>

      <button
        type="button"
        onClick={share}
        className="mb-3 w-full rounded-full bg-accent py-4 font-display font-bold text-accent-contrast"
      >
        {copied ? "Invoice link copied" : "Copy invoice link"}
      </button>
      <button
        type="button"
        onClick={resetFlow}
        className="mb-3 w-full rounded-full border border-line py-4 font-medium"
      >
        Create another invoice
      </button>
      <Link href="/dashboard" className="mt-2 text-sm text-muted">
        Back to dashboard
      </Link>
    </div>
  );

  return (
    <>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8 md:hidden">
        {step === "amount" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <Link href="/dashboard" className="text-sm text-muted">
                Cancel
              </Link>
              <p className="text-sm text-muted">Amount</p>
            </div>
            {stepProgress}
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <p
                aria-live="polite"
                className="font-display text-6xl font-extrabold tracking-tight tabular-nums"
              >
                {formatCents(mobileAmountCents)}
              </p>
              {quickAmountChips}
            </div>
            <Keypad onKey={onKey} />
            <button
              type="button"
              disabled={mobileAmountCents === 0}
              onClick={continueFromMobileAmount}
              className="mt-8 rounded-full bg-accent py-4 font-display font-bold text-accent-contrast disabled:opacity-40"
            >
              Next
            </button>
          </>
        )}

        {step === "details" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={() => setStep("amount")} className="text-sm text-muted">
                Back
              </button>
              <p className="text-sm text-muted">Details</p>
            </div>
            {stepProgress}
            <p className="mb-6 font-display text-3xl font-extrabold tabular-nums">
              {formatCents(totalCents)}
            </p>
            {recentClientChips}
            {productChips}
            <label className="mb-4 flex flex-col gap-1.5 text-sm">
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
            {renderMobileItems("bg-card")}
            <div className="mb-4">{renderTaxRow("bg-card")}</div>
            <div className="mb-4">{dueChips}</div>
            <div className="mb-4 flex flex-col">{renderClientName("bg-card")}</div>
            {renderAdditionalDetails("bg-card")}
            <div className="flex-1" />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => setStep("review")}
              className="mt-6 rounded-full bg-accent py-4 font-display font-bold text-accent-contrast disabled:opacity-40"
            >
              Review
            </button>
          </>
        )}

        {step === "review" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={() => setStep("details")} className="text-sm text-muted">
                Back
              </button>
              <p className="text-sm text-muted">Review</p>
            </div>
            {stepProgress}
            <div
              className="elevated mb-6 rounded-2xl border border-line bg-card p-6"
              style={{ borderStyle: "dashed" }}
            >
              <p className="mb-1 text-xs uppercase tracking-wide text-muted">{firstDescription}</p>
              <p className="mb-4 font-display text-4xl font-extrabold tabular-nums">
                {formatCents(totalCents)}
              </p>

              <div className="mb-2 border-t border-line pt-2">
                {invoiceRows.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 py-1 text-sm">
                    <span className="truncate text-muted">
                      {item.description}
                      {item.quantity > 1 && ` x ${item.quantity}`}
                    </span>
                    <span className="tabular-nums">{formatCents(item.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t border-line py-2 text-sm">
                <span className="text-muted">To</span>
                <span className="font-medium">{clientName || clientEmail}</span>
              </div>
              <div className="flex justify-between border-t border-line py-2 text-sm">
                <span className="text-muted">Due</span>
                <span>{dueLabel}</span>
              </div>
              {(ccEmails.trim() || bccEmails.trim()) && (
                <div className="border-t border-line py-2 text-sm">
                  {ccEmails.trim() && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">CC</span>
                      <span className="truncate text-right">{ccEmails}</span>
                    </div>
                  )}
                  {bccEmails.trim() && (
                    <div className="mt-1 flex justify-between gap-3">
                      <span className="text-muted">BCC</span>
                      <span className="truncate text-right">{bccEmails}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="border-t border-line pt-1">{totalsRows}</div>
            </div>
            <div className="mb-6 rounded-2xl border border-line bg-card p-4">{emailCopyFields}</div>
            {error && (
              <p role="alert" className="mb-4 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex-1" />
            <button
              type="button"
              disabled={loading}
              onClick={send}
              className="rounded-full bg-accent py-4 font-display font-bold text-accent-contrast disabled:opacity-60"
            >
              {loading ? "Finalizing..." : `Finalize and send ${formatCents(totalCents)}`}
            </button>
          </>
        )}

        {step === "sent" && <div className="flex flex-1 flex-col justify-center">{sentView}</div>}
      </main>

      <div className="hidden flex-1 px-8 py-8 md:block">
        <div className="mx-auto w-full max-w-7xl">
          {step === "review" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
              <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted">Review invoice</p>
                    <h1 className="font-display text-3xl font-extrabold tracking-tight">
                      Finalize and send
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted">
                      Review the client, line items, tax, payment terms, and payout before creating
                      the Stripe invoice and sending it to the client.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="text-sm font-medium text-muted hover:text-foreground"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-background p-5">
                    <p className="text-xs uppercase tracking-wide text-muted">Bill to</p>
                    <p className="mt-2 font-display text-xl font-bold">
                      {clientName || clientEmail}
                    </p>
                    <p className="text-sm text-muted">{clientEmail}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-background p-5">
                    <p className="text-xs uppercase tracking-wide text-muted">Payment terms</p>
                    <p className="mt-2 font-display text-xl font-bold">{dueLabel}</p>
                    <p className="text-sm text-muted">Secure checkout powered by Stripe</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-line bg-background p-5">
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-wide text-muted">Email copies</p>
                    <p className="mt-1 text-sm text-muted">
                      Add optional CC or BCC recipients before this branded invoice email is sent.
                    </p>
                  </div>
                  {emailCopyFields}
                </div>

                <div className="mt-5 rounded-2xl border border-line bg-background p-5">
                  <p className="mb-3 text-xs uppercase tracking-wide text-muted">Line items</p>
                  <div className="grid gap-3">
                    {invoiceRows.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.description}</p>
                          <p className="text-xs text-muted">Qty {item.quantity}</p>
                        </div>
                        <p className="shrink-0 font-medium tabular-nums">
                          {formatCents(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {(clientNote || invoiceTerms || privateMemo) && (
                  <div className="mt-5 rounded-2xl border border-line bg-background p-5">
                    <p className="mb-3 text-xs uppercase tracking-wide text-muted">Details</p>
                    <div className="grid gap-4 text-sm">
                      {clientNote && (
                        <div>
                          <p className="font-medium">Client note</p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted">
                            {clientNote}
                          </p>
                        </div>
                      )}
                      {invoiceTerms && (
                        <div>
                          <p className="font-medium">Terms & Conditions</p>
                          <p className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap rounded-xl bg-card p-3 leading-relaxed text-muted">
                            {invoiceTerms}
                          </p>
                          {requireSignature && (
                            <p className="mt-2 text-xs text-muted">
                              Signature required — you signed as{" "}
                              <span className="font-medium text-foreground">{senderSignerName}</span>.
                              The client signs before paying.
                            </p>
                          )}
                        </div>
                      )}
                      {privateMemo && (
                        <div>
                          <p className="font-medium">Private memo</p>
                          <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted">
                            {privateMemo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <aside className="lg:sticky lg:top-8 lg:self-start">
                <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <p className="text-sm font-medium text-muted">Final total</p>
                  <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
                    {formatCents(totalCents)}
                  </p>
                  <div className="mt-5 rounded-2xl border border-line bg-background p-5">
                    {totalsRows}
                  </div>
                  {error && (
                    <p role="alert" className="mt-4 text-sm text-danger">
                      {error}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={!canSend || loading}
                    onClick={send}
                    className="mt-5 w-full rounded-full bg-accent px-5 py-4 font-display font-bold text-accent-contrast disabled:opacity-40"
                  >
                    {loading ? "Finalizing..." : "Finalize and send invoice"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="mt-3 w-full rounded-full border border-line px-5 py-3 text-sm font-bold"
                  >
                    Back to edit
                  </button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                    Finalizing creates the Stripe invoice and sends the secure payment link.
                  </p>
                </div>
              </aside>
            </div>
          ) : step !== "sent" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
              <section className="rounded-2xl border border-line bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
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
                  <div className="flex flex-col justify-end pb-3">
                    {renderClientName("bg-background")}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                  {recentClientChips && <div className="min-w-0">{recentClientChips}</div>}
                  {productChips && <div className="min-w-0">{productChips}</div>}
                </div>

                <div className="mt-3">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-bold">Line items</h2>
                      <p className="text-sm text-muted">
                        Add the products or services being billed.
                      </p>
                    </div>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => addItem()}
                        className="hidden rounded-full border border-line bg-background px-4 py-2 text-sm font-bold text-foreground hover:border-accent sm:inline-flex"
                      >
                        + Add item
                      </button>
                    )}
                  </div>
                  {desktopItems}
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.85fr]">
                  <div className="rounded-2xl border border-line bg-background p-4">
                    <h2 className="mb-3 font-display text-xl font-bold">Payment terms</h2>
                    {dueChips}
                  </div>
                  <div className="rounded-2xl border border-line bg-background p-4">
                    <h2 className="mb-3 font-display text-xl font-bold">Tax</h2>
                    {renderTaxRow("bg-background")}
                  </div>
                </div>
                <div className="mt-4">{renderAdditionalDetails("bg-background")}</div>
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
                    <div className="border-b border-line pb-4">
                      <p className="text-xs uppercase tracking-wide text-muted">Bill to</p>
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

                  {error && (
                    <p role="alert" className="mt-4 text-sm text-danger">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={!canSend}
                    onClick={() => setStep("review")}
                    className="mt-5 w-full rounded-full bg-accent px-5 py-4 font-display font-bold text-accent-contrast disabled:opacity-40"
                  >
                    {totalCents > 0 ? `Review invoice for ${formatCents(totalCents)}` : "Review invoice"}
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
    </>
  );
}
