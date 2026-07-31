"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCents, initials } from "@/lib/format";
import { StatusPill } from "@/components/status-pill";

type Estimate = {
  id: string;
  clientEmail: string;
  clientName: string | null;
  description: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt: Date | null;
  createdAt: Date;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "accepted", label: "Accepted" },
  { key: "converted", label: "Converted" },
  { key: "declined", label: "Declined" },
  { key: "expired", label: "Expired" },
  { key: "canceled", label: "Canceled" },
] as const;

function formatDate(date: Date | null) {
  if (!date) return "No expiry";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function EstimateTable({ estimates }: { estimates: Estimate[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return estimates.filter((estimate) => {
      if (filter !== "all" && estimate.status !== filter) return false;
      if (!q) return true;
      return (
        estimate.clientEmail.toLowerCase().includes(q) ||
        (estimate.clientName?.toLowerCase().includes(q) ?? false) ||
        estimate.description.toLowerCase().includes(q)
      );
    });
  }, [estimates, query, filter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 overflow-x-auto rounded-full border border-line p-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
                filter === item.key ? "bg-accent text-accent-contrast" : "text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          aria-label="Search estimates"
          placeholder="Search client or scope..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-56 rounded-full border border-line bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {estimates.length === 0
              ? "No estimates yet. Create one before the invoice stage."
              : "Nothing matches that search."}
          </p>
        )}
        {filtered.length > 0 && (
          <>
            {/* Stacked rows below md: a 5-column table has no room on a
                phone, and the app's own pitch is "invoice from your phone". */}
            <div className="md:hidden">
              {filtered.map((estimate) => (
                <Link
                  key={estimate.id}
                  href={`/estimates/${estimate.id}`}
                  className="flex items-center gap-3 border-b border-line p-4 last:border-0 hover:bg-line/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-background font-display text-xs font-bold">
                    {initials(estimate.clientName, estimate.clientEmail)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {estimate.clientName || estimate.clientEmail}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {estimate.description} · {formatDate(estimate.expiresAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="font-display font-bold tabular-nums">
                      {formatCents(estimate.amount, estimate.currency)}
                    </span>
                    <StatusPill status={estimate.status} />
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Scope</th>
                    <th className="px-5 py-3 font-medium">Expires</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((estimate) => (
                    <tr
                      key={estimate.id}
                      onClick={() => router.push(`/estimates/${estimate.id}`)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-line/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line bg-background font-display text-xs font-bold">
                            {initials(estimate.clientName, estimate.clientEmail)}
                          </span>
                          <Link
                            href={`/estimates/${estimate.id}`}
                            className="truncate hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {estimate.clientName || estimate.clientEmail}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted">{estimate.description}</td>
                      <td className="px-5 py-3 text-muted">{formatDate(estimate.expiresAt)}</td>
                      <td className="px-5 py-3 text-right font-display font-bold tabular-nums">
                        {formatCents(estimate.amount, estimate.currency)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <StatusPill status={estimate.status} />
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
