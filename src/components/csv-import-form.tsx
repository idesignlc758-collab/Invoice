"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CsvImportForm({ bankAccountId }: { bankAccountId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function importCsv() {
    setImporting(true);
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/bank-accounts/${bankAccountId}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const data = await response.json().catch(() => ({}));
    setImporting(false);
    if (!response.ok) {
      setError(data.error ?? "Could not import that CSV.");
      return;
    }
    setMessage(`Imported ${data.imported} transaction${data.imported === 1 ? "" : "s"}.`);
    setCsv("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl border border-line px-4 py-2.5 text-sm font-bold"
      >
        Import CSV
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-sm font-medium">Paste CSV</p>
      <p className="mt-1 text-xs text-muted">
        Header row with <code>date</code>, <code>description</code>, <code>amount</code> columns.
        Amount is signed: positive for money in, negative for money out.
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder={"date,description,amount\n2026-01-05,Client payment,1200.00\n2026-01-06,Office supplies,-45.20"}
        className="mt-2 w-full resize-none rounded-xl border border-line bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {message && <p className="mt-2 text-sm text-success">{message}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={importCsv}
          disabled={importing || !csv.trim()}
          className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-contrast disabled:opacity-60"
        >
          {importing ? "Importing…" : "Import"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-2xl border border-line px-4 py-2.5 text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
