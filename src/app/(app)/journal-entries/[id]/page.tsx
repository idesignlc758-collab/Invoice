import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { JournalEntryReverseButton } from "@/components/journal-entry-reverse-button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default async function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const entry = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id },
    include: {
      lines: { orderBy: { position: "asc" }, include: { account: true } },
      reversalOf: true,
      reversedBy: true,
    },
  });

  if (!entry) notFound();

  const total = entry.lines.reduce((sum, line) => sum + line.debit, 0);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <Link href="/journal-entries" className="self-start text-sm text-muted">
        ← Journal Entries
      </Link>

      <div>
        <p className="text-sm text-muted">{formatDate(entry.date)}</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {entry.memo || "Journal entry"}
        </h1>
        {entry.reversalOf && (
          <p className="mt-1 text-sm text-muted">
            Reverses{" "}
            <Link href={`/journal-entries/${entry.reversalOf.id}`} className="text-accent underline">
              {entry.reversalOf.memo || entry.reversalOf.id}
            </Link>
          </p>
        )}
        {entry.reversedBy && (
          <p className="mt-1 text-sm text-muted">
            Reversed by{" "}
            <Link href={`/journal-entries/${entry.reversedBy.id}`} className="text-accent underline">
              this entry
            </Link>
          </p>
        )}
      </div>

      <section className="rounded-2xl border border-line bg-card p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 font-medium">Account</th>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Debit</th>
                <th className="py-2 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((line) => (
                <tr key={line.id} className="border-b border-line last:border-0">
                  <td className="py-2">
                    {line.account.code} · {line.account.name}
                  </td>
                  <td className="py-2 text-muted">{line.description || "—"}</td>
                  <td className="py-2 text-right tabular-nums">
                    {line.debit > 0 ? formatCents(line.debit) : ""}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {line.credit > 0 ? formatCents(line.credit) : ""}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2" colSpan={2}>
                  Total
                </td>
                <td className="py-2 text-right tabular-nums">{formatCents(total)}</td>
                <td className="py-2 text-right tabular-nums">{formatCents(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {!entry.reversedBy && (
        <div>
          <JournalEntryReverseButton entryId={entry.id} />
        </div>
      )}
    </main>
  );
}
