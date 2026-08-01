import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { JournalEntryForm } from "@/components/journal-entry-form";

export default async function NewJournalEntryPage() {
  const user = await getCurrentUser();
  const accounts = await prisma.account.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { code: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Manual double-entry bookkeeping</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">New journal entry</h1>
        </div>
        <Link href="/journal-entries" className="text-sm font-medium text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
      {accounts.length === 0 ? (
        <p className="rounded-2xl bg-line px-4 py-3 text-center text-sm text-muted">
          Set up your{" "}
          <Link href="/accounts" className="text-accent underline">
            chart of accounts
          </Link>{" "}
          before posting a journal entry.
        </p>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
          <JournalEntryForm accounts={accounts} />
        </div>
      )}
    </main>
  );
}
