import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { normalBalanceSign, type AccountType } from "@/lib/account-constants";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function GeneralLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountId } = await searchParams;
  const user = await getCurrentUser();

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { code: "asc" },
  });

  const selectedAccount = accountId ? accounts.find((a) => a.id === accountId) : null;

  const lines = selectedAccount
    ? await prisma.journalEntryLine.findMany({
        where: { accountId: selectedAccount.id, journalEntry: { userId: user.id } },
        include: { journalEntry: true },
        orderBy: [{ journalEntry: { date: "asc" } }, { position: "asc" }],
      })
    : [];

  const sign = selectedAccount ? normalBalanceSign(selectedAccount.type as AccountType) : 1;
  const rows = lines.reduce<{ line: (typeof lines)[number]; runningCents: number }[]>((acc, line) => {
    const previousBalance = acc.length > 0 ? acc[acc.length - 1].runningCents : 0;
    acc.push({ line, runningCents: previousBalance + sign * (line.debit - line.credit) });
    return acc;
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Per-account transaction history</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">General Ledger</h1>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          Account
          <select
            name="account"
            defaultValue={accountId ?? ""}
            className="min-w-64 rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select an account…</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} · {account.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-accent px-5 font-display font-bold text-accent-contrast"
        >
          View ledger
        </button>
      </form>

      {!selectedAccount ? (
        <p className="rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
          Select an account to see its transaction history.
        </p>
      ) : (
        <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
          <h2 className="mb-4 font-display text-xl font-bold">
            {selectedAccount.code} · {selectedAccount.name}
          </h2>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No activity posted to this account yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Memo</th>
                    <th className="px-3 py-2 text-right font-medium">Debit</th>
                    <th className="px-3 py-2 text-right font-medium">Credit</th>
                    <th className="px-3 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ line, runningCents: balance }) => (
                    <tr key={line.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 text-muted">{formatDate(line.journalEntry.date)}</td>
                      <td className="px-3 py-2">
                        <Link href={`/journal-entries/${line.journalEntryId}`} className="hover:underline">
                          {line.description || line.journalEntry.memo || "Journal entry"}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {line.debit > 0 ? formatCents(line.debit) : ""}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {line.credit > 0 ? formatCents(line.credit) : ""}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatCents(balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
