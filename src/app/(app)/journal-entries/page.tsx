import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function JournalEntriesPage() {
  const user = await getCurrentUser();
  const entries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    include: { lines: true, reversalOf: true, reversedBy: true },
    orderBy: { date: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Manual double-entry bookkeeping</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Journal Entries</h1>
        </div>
        <Link
          href="/journal-entries/new"
          className="min-h-11 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-contrast"
        >
          + New entry
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No journal entries yet. Set up your{" "}
            <Link href="/accounts" className="text-accent underline">
              chart of accounts
            </Link>{" "}
            first, then post your first entry.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Memo</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const total = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                  return (
                    <tr key={entry.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 text-muted">{formatDate(entry.date)}</td>
                      <td className="px-5 py-3">
                        <Link href={`/journal-entries/${entry.id}`} className="hover:underline">
                          {entry.memo || "Journal entry"}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right font-display font-bold tabular-nums">
                        {formatCents(total)}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {entry.reversalOf ? "Reversal" : entry.reversedBy ? "Reversed" : "Posted"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
