"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCents, initials } from "@/lib/format";

type SaleReceipt = {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerEmail: string;
  saleDate: Date;
  total: number;
  currency: string;
  status: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "void", label: "Void" },
] as const;

export function SaleReceiptTable({ receipts }: { receipts: SaleReceipt[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return receipts.filter((receipt) => {
      if (filter !== "all" && receipt.status !== filter) return false;
      if (!q) return true;
      return (
        receipt.customerName.toLowerCase().includes(q) ||
        receipt.customerEmail.toLowerCase().includes(q) ||
        receipt.receiptNumber.toLowerCase().includes(q)
      );
    });
  }, [receipts, query, filter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 rounded-full border border-line p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
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
          aria-label="Search sale receipts"
          placeholder="Search customer or receipt #…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56 rounded-full border border-line bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {receipts.length === 0
              ? "No sale receipts yet — log your first payment from the sidebar."
              : "Nothing matches that search."}
          </p>
        )}
        {filtered.length > 0 && (
          <>
            <div className="md:hidden">
              {filtered.map((receipt) => (
                <Link
                  key={receipt.id}
                  href={`/sale-receipts/${receipt.id}`}
                  className="flex items-center gap-3 border-b border-line p-4 last:border-0 hover:bg-line/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-background font-display text-xs font-bold">
                    {initials(receipt.customerName, receipt.customerEmail)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{receipt.customerName}</p>
                    <p className="truncate text-sm text-muted">
                      {receipt.receiptNumber} · {formatDate(receipt.saleDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`font-display font-bold tabular-nums ${
                        receipt.status === "void" ? "text-muted line-through" : ""
                      }`}
                    >
                      {formatCents(receipt.total, receipt.currency)}
                    </span>
                    {receipt.status === "void" && (
                      <span className="text-xs text-muted">Void</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Receipt #</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((receipt) => (
                    <tr
                      key={receipt.id}
                      onClick={() => router.push(`/sale-receipts/${receipt.id}`)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-line/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-background font-display text-xs font-bold">
                            {initials(receipt.customerName, receipt.customerEmail)}
                          </span>
                          <Link
                            href={`/sale-receipts/${receipt.id}`}
                            className="truncate hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {receipt.customerName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted">{receipt.receiptNumber}</td>
                      <td className="px-5 py-3 text-muted">{formatDate(receipt.saleDate)}</td>
                      <td
                        className={`px-5 py-3 text-right font-display font-bold tabular-nums ${
                          receipt.status === "void" ? "text-muted line-through" : ""
                        }`}
                      >
                        {formatCents(receipt.total, receipt.currency)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted">
                        {receipt.status === "void" ? "Void" : "Completed"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
