import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS, normalBalanceSign, type AccountType } from "@/lib/account-constants";

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ asOf?: string }>;
}) {
  const { asOf } = await searchParams;
  const asOfDate = asOf ? new Date(`${asOf}T23:59:59`) : new Date();
  const user = await getCurrentUser();

  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { code: "asc" },
    include: {
      journalEntryLines: {
        where: { journalEntry: { userId: user.id, date: { lte: asOfDate } } },
      },
    },
  });

  const rows = accounts
    .map((account) => {
      const totalDebit = account.journalEntryLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = account.journalEntryLines.reduce((sum, line) => sum + line.credit, 0);
      const sign = normalBalanceSign(account.type as AccountType);
      const balance = sign * (totalDebit - totalCredit);
      return { account, totalDebit, totalCredit, balance };
    })
    .filter((row) => row.totalDebit > 0 || row.totalCredit > 0);

  const grandDebit = rows.reduce((sum, row) => sum + row.totalDebit, 0);
  const grandCredit = rows.reduce((sum, row) => sum + row.totalCredit, 0);
  const isBalanced = grandDebit === grandCredit;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">All accounts, as of a date</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Trial Balance</h1>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          As of
          <input
            type="date"
            name="asOf"
            defaultValue={asOf || todayInputValue()}
            className="rounded-xl border border-line bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-accent px-5 font-display font-bold text-accent-contrast"
        >
          View
        </button>
      </form>

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No posted activity yet. Post a journal entry to see it here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Account</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Debit</th>
                  <th className="px-3 py-2 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ account, totalDebit, totalCredit }) => (
                  <tr key={account.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">
                      {account.code} · {account.name}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {ACCOUNT_TYPE_LABELS[account.type as AccountType]}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {totalDebit > 0 ? formatCents(totalDebit) : ""}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {totalCredit > 0 ? formatCents(totalCredit) : ""}
                    </td>
                  </tr>
                ))}
                <tr className="bg-line/40 font-bold">
                  <td className="px-3 py-2" colSpan={2}>
                    Total
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCents(grandDebit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCents(grandCredit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 0 && (
          <p className={`mt-4 text-sm font-medium ${isBalanced ? "text-success" : "text-danger"}`}>
            {isBalanced
              ? "Books balance — total debits equal total credits."
              : `Out of balance by ${formatCents(Math.abs(grandDebit - grandCredit))}. This shouldn't happen if every entry was posted through Journal Entries.`}
          </p>
        )}
      </section>
    </main>
  );
}
