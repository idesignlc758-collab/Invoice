"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { formatCents } from "@/lib/format";
import { EXPENSE_PAYMENT_METHODS } from "@/lib/expense-constants";

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";
const textareaClass =
  "resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";

type Item = { id: string; description: string; quantity: string; unitAmount: string };

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createBlankItem(): Item {
  return { id: crypto.randomUUID(), description: "", quantity: "1", unitAmount: "" };
}

export function SaleReceiptForm() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [saleDate, setSaleDate] = useState(todayInputValue());
  const [items, setItems] = useState<Item[]>([createBlankItem()]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedItems = items.map((item) => ({
    description: item.description.trim(),
    quantity: Number(item.quantity),
    unitAmountCents: Math.round(Number(item.unitAmount) * 100),
  }));
  const validItems = parsedItems.filter(
    (item) => item.description && item.quantity > 0 && item.unitAmountCents > 0
  );
  const subtotalCents = validItems.reduce((sum, item) => sum + item.quantity * item.unitAmountCents, 0);
  const taxAmountCents = Math.round(subtotalCents * (Number(taxPercent) / 100));
  const totalCents = subtotalCents + taxAmountCents;

  const canSave =
    customerName.trim().length > 0 &&
    customerEmail.trim().length > 3 &&
    Boolean(saleDate) &&
    validItems.length > 0;

  function updateItem(id: string, patch: Partial<Omit<Item, "id">>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const response = await fetch("/api/sale-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        customerEmail,
        customerAddress: customerAddress || undefined,
        saleDate,
        items: validItems,
        taxPercent: Number(taxPercent) || 0,
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentReference || undefined,
        notes: notes || undefined,
        sendEmail,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save the receipt. Try again.");
      return;
    }

    router.push(`/sale-receipts/${data.receipt.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Customer name
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Jordan Lee"
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Customer email
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="jordan@example.com"
            className={inputClass}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Customer address <span className="text-muted">(optional)</span>
        <input
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          placeholder="123 Main St, Springfield"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Sale date
        <input
          type="date"
          value={saleDate}
          onChange={(e) => setSaleDate(e.target.value)}
          className={`${inputClass} max-w-xs`}
          required
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Items</p>
          <button
            type="button"
            onClick={() => setItems((current) => [...current, createBlankItem()])}
            className="flex items-center gap-1 text-sm font-bold text-accent"
          >
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-line p-3 sm:flex-row sm:items-center">
              <input
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="Description"
                className={`${inputClass} flex-1`}
              />
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                placeholder="Qty"
                className={`${inputClass} sm:w-20`}
              />
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={item.unitAmount}
                onChange={(e) => updateItem(item.id, { unitAmount: e.target.value })}
                placeholder="Rate"
                className={`${inputClass} sm:w-28`}
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-danger disabled:opacity-30"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Tax rate (%)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="0.1"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Payment method <span className="text-muted">(optional)</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
            <option value="">Not specified</option>
            {EXPENSE_PAYMENT_METHODS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Payment reference <span className="text-muted">(optional)</span>
        <input
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          placeholder="Check #, transaction ID, etc."
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Notes <span className="text-muted">(optional)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Internal note for your own records."
          className={textareaClass}
        />
      </label>

      <div className="rounded-2xl border border-line bg-background p-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums">{formatCents(subtotalCents)}</span>
        </div>
        {taxAmountCents > 0 && (
          <div className="mt-1 flex justify-between text-sm">
            <span className="text-muted">Tax</span>
            <span className="tabular-nums">{formatCents(taxAmountCents)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-line pt-2 font-display text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCents(totalCents)}</span>
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={sendEmail}
          onChange={(e) => setSendEmail(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        <span>Email a copy of this receipt to the customer now.</span>
      </label>

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
        {saving ? "Saving…" : "Save receipt"}
      </button>
    </form>
  );
}
