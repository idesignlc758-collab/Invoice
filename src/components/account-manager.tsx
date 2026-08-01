"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/account-constants";

type Account = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
};

export function AccountManager({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("expense");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, type, description }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save account.");
      return;
    }

    setCode("");
    setName("");
    setDescription("");
    router.refresh();
  }

  async function seedDefaults() {
    setSeeding(true);
    setError(null);
    const res = await fetch("/api/accounts/seed-defaults", { method: "POST" });
    setSeeding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not set up default accounts.");
      return;
    }
    router.refresh();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }

  const grouped = ACCOUNT_TYPES.map((accountType) => ({
    type: accountType,
    accounts: accounts.filter((account) => account.type === accountType),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="flex flex-col gap-4">
        <form onSubmit={createAccount} className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <h2 className="font-display text-xl font-bold">Add account</h2>
          <p className="mt-1 text-sm text-muted">
            Assets, liabilities, equity, income, and expense categories for your books.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                Code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="5700"
                  className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ACCOUNT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Equipment Expense"
                className="rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Description <span className="text-muted">(optional)</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="resize-none rounded-2xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
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
              {loading ? "Saving…" : "Save account"}
            </button>
          </div>
        </form>

        {accounts.length === 0 && (
          <button
            type="button"
            onClick={seedDefaults}
            disabled={seeding}
            className="rounded-2xl border border-dashed border-line p-5 text-left text-sm font-medium text-muted hover:border-accent hover:text-foreground"
          >
            {seeding ? "Setting up…" : "+ Set up a default chart of accounts (16 common accounts)"}
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Chart of accounts</h2>
          <span className="text-sm text-muted">{accounts.length} accounts</span>
        </div>
        <div className="flex flex-col gap-5">
          {accounts.length === 0 && (
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted">
              No accounts yet. Add one, or set up the default chart on the left.
            </p>
          )}
          {grouped
            .filter((group) => group.accounts.length > 0)
            .map((group) => (
              <div key={group.type}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {ACCOUNT_TYPE_LABELS[group.type]}
                </p>
                <div className="flex flex-col gap-2">
                  {group.accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl bg-background p-3 ${
                        account.isActive ? "" : "opacity-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          <span className="text-muted">{account.code}</span> · {account.name}
                        </p>
                        {account.description && (
                          <p className="truncate text-sm text-muted">{account.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleActive(account.id, !account.isActive)}
                        className="shrink-0 text-xs font-medium text-muted hover:text-foreground"
                      >
                        {account.isActive ? "Archive" : "Restore"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
