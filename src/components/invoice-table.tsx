"use client";

import { useMemo, useState } from "react";
import { formatCents, initials } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";

type Invoice = {
  id: string;
  clientEmail: string;
  clientName: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "open", label: "Awaiting" },
  { key: "payment_failed", label: "Failed" },
] as const;

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filter !== "all" && inv.status !== filter) return false;
      if (!q) return true;
      return (
        inv.clientEmail.toLowerCase().includes(q) ||
        (inv.clientName?.toLowerCase().includes(q) ?? false) ||
        inv.description.toLowerCase().includes(q)
      );
    });
  }, [invoices, query, filter]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex gap-1 rounded-full border border-line p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                filter === f.key ? "bg-accent text-accent-contrast" : "text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search client or job…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-full border border-line bg-card px-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="rounded-2xl border border-line bg-card overflow-hidden">
        {filtered.length === 0 && (
          <p className="text-sm text-muted py-10 text-center">
            {invoices.length === 0
              ? "No invoices yet — send your first one from the sidebar."
              : "Nothing matches that search."}
          </p>
        )}
        {filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="font-medium px-5 py-3">Client</th>
                <th className="font-medium px-5 py-3">Job</th>
                <th className="font-medium px-5 py-3">Sent</th>
                <th className="font-medium px-5 py-3 text-right">Amount</th>
                <th className="font-medium px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => (
                <tr key={invoice.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 flex-shrink-0 rounded-full bg-background border border-line flex items-center justify-center font-display font-bold text-xs">
                        {initials(invoice.clientName, invoice.clientEmail)}
                      </span>
                      <span className="truncate">{invoice.clientName || invoice.clientEmail}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{invoice.description}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(invoice.createdAt)}</td>
                  <td className="px-5 py-3 text-right font-display font-bold tabular-nums">
                    {formatCents(invoice.amount, invoice.currency)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <StatusPill status={invoice.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
