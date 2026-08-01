"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/format";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
];

type BankAccount = {
  id: string;
  name: string;
  accountType: string;
  last4: string | null;
  balanceCents: number;
  unreconciledCount: number;
  isActive: boolean;
};

export function BankAccountManager({ accounts }: { accounts: BankAccount[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("checking");
  const [last4, setLast4] = useState("");
  const [startingBalance, setStartingBalance] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bank-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, accountType, last4, startingBalance: startingBalance || 0 }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save bank account.");
      return;
    }
    setName("");
    setLast4("");
    setStartingBalance("");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={createAccount} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold">Add bank account</h2>
        <p className="mt-1 text-sm text-muted">
          Tracked manually here — import transactions via CSV, then reconcile.
        </p>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Business Checking"
              className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              Type
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Last 4 digits <span className="text-muted">(optional)</span>
              <input
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                maxLength={4}
                placeholder="1234"
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            Starting balance
            <div className="flex items-center rounded-2xl border border-line bg-background px-4 py-3 focus-within:ring-2 focus-within:ring-accent">
              <span className="mr-1 text-muted">$</span>
              <input
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent text-base focus:outline-none"
              />
            </div>
          </label>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 rounded-2xl bg-accent px-5 text-sm font-bold text-accent-contrast disabled:opacity-60"
          >
            {loading ? "Saving…" : "Add account"}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Accounts</h2>
          <span className="text-sm text-muted">{accounts.length} accounts</span>
        </div>
        <div className="flex flex-col gap-3">
          {accounts.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No bank accounts yet. Add one on the left.
            </p>
          )}
          {accounts.map((account) => (
            <Link
              key={account.id}
              href={`/banking/${account.id}`}
              className={`flex items-center justify-between gap-3 rounded-2xl bg-background p-4 hover:bg-line/30 ${
                account.isActive ? "" : "opacity-50"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {account.name}
                  {account.last4 ? ` ····${account.last4}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {account.accountType.replace("_", " ")}
                  {account.isActive ? "" : " · archived"}
                  {account.unreconciledCount > 0 ? ` · ${account.unreconciledCount} to reconcile` : ""}
                </p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold tabular-nums">
                {formatCents(account.balanceCents)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
