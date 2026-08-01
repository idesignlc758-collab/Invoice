"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { formatCents } from "@/lib/format";

type Expense = {
  id: string;
  date: Date;
  description: string;
  category: string;
  vendor: string | null;
  amount: number;
  receiptUrl: string | null;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(
      (expense) =>
        expense.description.toLowerCase().includes(q) ||
        expense.category.toLowerCase().includes(q) ||
        (expense.vendor?.toLowerCase().includes(q) ?? false)
    );
  }, [expenses, query]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-4 flex-wrap">
        <input
          type="search"
          aria-label="Search expenses"
          placeholder="Search description, category, or vendor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-72 rounded-full border border-line bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            {expenses.length === 0
              ? "No expenses yet — log your first one from the sidebar."
              : "Nothing matches that search."}
          </p>
        )}
        {filtered.length > 0 && (
          <>
            <div className="md:hidden">
              {filtered.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/expenses/${expense.id}`}
                  className="flex items-center gap-3 border-b border-line p-4 last:border-0 hover:bg-line/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{expense.description}</p>
                    <p className="truncate text-sm text-muted">
                      {expense.category} · {formatDate(expense.date)}
                      {expense.vendor ? ` · ${expense.vendor}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {expense.receiptUrl && (
                      <Paperclip className="h-3.5 w-3.5 text-muted" aria-label="Has receipt" />
                    )}
                    <span className="font-display font-bold tabular-nums">
                      {formatCents(expense.amount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Vendor</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expense) => (
                    <tr
                      key={expense.id}
                      onClick={() => router.push(`/expenses/${expense.id}`)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-line/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/expenses/${expense.id}`}
                            className="truncate hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {expense.description}
                          </Link>
                          {expense.receiptUrl && (
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Has receipt" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted">{expense.category}</td>
                      <td className="px-5 py-3 text-muted">{expense.vendor || "—"}</td>
                      <td className="px-5 py-3 text-muted">{formatDate(expense.date)}</td>
                      <td className="px-5 py-3 text-right font-display font-bold tabular-nums">
                        {formatCents(expense.amount)}
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
