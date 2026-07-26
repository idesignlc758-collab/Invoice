"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewInvoicePage() {
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentUrl, setSentUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail, clientName, description, amount, dueDate }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    setSentUrl(data.hostedInvoiceUrl ?? null);
  }

  if (sentUrl !== null) {
    return (
      <main className="max-w-md mx-auto px-6 py-10">
        <h1 className="font-serif text-2xl mb-2">Invoice sent</h1>
        <p className="text-sm text-muted mb-4">
          {clientEmail} will get an email from Stripe with a link to pay. You can also share
          this link directly:
        </p>
        <div className="rounded-md border border-line bg-card p-3 text-sm break-all font-mono mb-6">
          {sentUrl}
        </div>
        <Link href="/dashboard" className="text-accent font-medium text-sm">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10">
      <h1 className="font-serif text-2xl mb-1">New invoice</h1>
      <p className="text-sm text-muted mb-6">We keep 5% — the rest goes straight to you.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Client email
          <input
            type="email"
            required
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="rounded-md border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Client name <span className="text-muted">(optional)</span>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="rounded-md border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          What&apos;s this for?
          <input
            type="text"
            required
            placeholder="Website redesign"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Amount (USD)
          <input
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="1200.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-md border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Due date <span className="text-muted">(optional)</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-line bg-card px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-accent text-accent-contrast font-medium py-2.5 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send invoice"}
        </button>
      </form>
    </main>
  );
}
