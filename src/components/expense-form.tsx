"use client";

import { upload } from "@vercel/blob/client";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from "@/lib/expense-constants";

const inputClass =
  "rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";
const textareaClass =
  "resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:ring-2 focus:ring-accent";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

type InitialExpense = {
  id: string;
  date: string; // yyyy-mm-dd
  description: string;
  amount: string; // dollars, e.g. "42.50"
  category: string;
  vendor: string;
  paymentMethod: string;
  notes: string;
  receiptUrl: string | null;
  projectId: string;
};

type ProjectOption = { id: string; name: string };

export function ExpenseForm({
  initialExpense,
  projects = [],
}: {
  initialExpense?: InitialExpense;
  projects?: ProjectOption[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(initialExpense?.date ?? todayInputValue());
  const [description, setDescription] = useState(initialExpense?.description ?? "");
  const [amount, setAmount] = useState(initialExpense?.amount ?? "");
  const [category, setCategory] = useState<string>(initialExpense?.category ?? "");
  const [vendor, setVendor] = useState(initialExpense?.vendor ?? "");
  const [paymentMethod, setPaymentMethod] = useState(initialExpense?.paymentMethod ?? "");
  const [notes, setNotes] = useState(initialExpense?.notes ?? "");
  const [projectId, setProjectId] = useState(initialExpense?.projectId ?? "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(initialExpense?.receiptUrl ?? null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave =
    description.trim().length > 0 && Number(amount) > 0 && Boolean(date) && Boolean(category);

  async function uploadReceipt(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (file.size > 20 * 1024 * 1024) {
      setError("Receipt must be 20 MB or smaller.");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Upload a PNG, JPG, WebP, GIF, or PDF receipt.");
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await upload(`expenses/receipts/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/expenses/upload",
        multipart: true,
        contentType: file.type,
      });
      setReceiptUrl(blob.url);
      setReceiptName(file.name);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload receipt.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const isEdit = Boolean(initialExpense);
    const response = await fetch(
      isEdit ? `/api/expenses/${initialExpense!.id}` : "/api/expenses",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          amount,
          category,
          vendor: vendor || null,
          paymentMethod: paymentMethod || null,
          receiptUrl: receiptUrl || null,
          notes: notes || null,
          projectId: projectId || null,
        }),
      }
    );
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save expense. Try again.");
      return;
    }

    router.push(isEdit ? `/expenses/${initialExpense!.id}` : "/expenses");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Amount
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
            required
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Description
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Adobe Creative Cloud subscription"
          className={inputClass}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Choose a category
            </option>
            {EXPENSE_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Vendor <span className="text-muted">(optional)</span>
          <input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Adobe"
            className={inputClass}
          />
        </label>
        {projects.length > 0 && (
          <label className="flex flex-col gap-1.5 text-sm">
            Project <span className="text-muted">(optional)</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
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

      <div className="flex flex-col gap-1.5 text-sm">
        Receipt <span className="text-muted">(optional)</span>
        <label className="inline-flex min-h-12 w-fit cursor-pointer items-center justify-center gap-2 rounded-2xl border border-line bg-background px-4 text-sm font-bold transition hover:bg-line/40">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? "Uploading…" : receiptUrl ? "Replace receipt" : "Upload receipt"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="sr-only"
            onChange={(e) => uploadReceipt(e.target.files?.[0])}
          />
        </label>
        {receiptName && <span className="text-xs text-muted">{receiptName}</span>}
        {!receiptName && receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent underline"
          >
            View current receipt
          </a>
        )}
      </div>

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
        {saving ? "Saving…" : initialExpense ? "Save changes" : "Save expense"}
      </button>
    </form>
  );
}
