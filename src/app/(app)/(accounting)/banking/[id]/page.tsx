import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { CsvImportForm } from "@/components/csv-import-form";
import { BankTransactionRow } from "@/components/bank-transaction-row";
import { ArchiveToggle } from "@/components/archive-toggle";

const MATCH_WINDOW_DAYS = 30;

export default async function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const account = await prisma.bankAccount.findFirst({
    where: { id, userId: user.id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        include: {
          matchedExpense: true,
          matchedInvoice: true,
          matchedSaleReceipt: true,
        },
      },
    },
  });
  if (!account) notFound();

  const balanceCents =
    account.startingBalance + account.transactions.reduce((sum, t) => sum + t.amount, 0);

  // Candidate pools for matching, computed once and filtered per-transaction
  // by amount + a date window rather than re-querying per row.
  const [unmatchedExpenses, unmatchedInvoices, unmatchedReceipts] = await Promise.all([
    prisma.expense.findMany({ where: { userId: user.id, matchedBankTransaction: null } }),
    prisma.invoice.findMany({
      where: { userId: user.id, status: "paid", matchedBankTransaction: null },
    }),
    prisma.saleReceipt.findMany({
      where: { userId: user.id, status: "completed", matchedBankTransaction: null },
    }),
  ]);

  function withinWindow(a: Date, b: Date) {
    return Math.abs(a.getTime() - b.getTime()) <= MATCH_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  }

  const rows = account.transactions.map((transaction) => {
    const matchedLabel = transaction.matchedExpense
      ? `Expense: ${transaction.matchedExpense.description}`
      : transaction.matchedInvoice
        ? `Invoice: ${transaction.matchedInvoice.description}`
        : transaction.matchedSaleReceipt
          ? `Receipt: ${transaction.matchedSaleReceipt.receiptNumber}`
          : null;

    const candidates =
      transaction.amount < 0
        ? unmatchedExpenses
            .filter((e) => e.amount === Math.abs(transaction.amount) && withinWindow(e.date, transaction.date))
            .map((e) => ({
              type: "expense" as const,
              id: e.id,
              label: `${e.description} — ${formatCents(e.amount)}`,
            }))
        : [
            ...unmatchedInvoices
              .filter((i) => i.amount === transaction.amount && i.paidAt && withinWindow(i.paidAt, transaction.date))
              .map((i) => ({
                type: "invoice" as const,
                id: i.id,
                label: `Invoice: ${i.description} — ${formatCents(i.amount)}`,
              })),
            ...unmatchedReceipts
              .filter((r) => r.total === transaction.amount && withinWindow(r.saleDate, transaction.date))
              .map((r) => ({
                type: "saleReceipt" as const,
                id: r.id,
                label: `Receipt ${r.receiptNumber} — ${formatCents(r.total)}`,
              })),
          ];

    return { transaction, candidates, matchedLabel };
  });

  const unreconciledCount = account.transactions.filter((t) => !t.isReconciled).length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <Link href="/banking" className="self-start text-sm text-muted">
        ← Banking
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            {account.accountType.replace("_", " ")}
            {account.last4 ? ` ····${account.last4}` : ""}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{account.name}</h1>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formatCents(balanceCents)}</p>
          {!account.isActive && <p className="mt-1 text-sm text-muted">Archived</p>}
        </div>
        <div className="flex flex-col items-end gap-3">
          <CsvImportForm bankAccountId={account.id} />
          <ArchiveToggle
            endpoint={`/api/bank-accounts/${account.id}`}
            isActive={account.isActive}
            label="account"
            redirectTo="/banking"
          />
        </div>
      </div>

      {unreconciledCount > 0 && (
        <p className="rounded-2xl bg-line px-4 py-3 text-sm text-muted">
          {unreconciledCount} transaction{unreconciledCount === 1 ? "" : "s"} awaiting reconciliation.
        </p>
      )}

      <section className="rounded-3xl border border-line bg-card p-4 md:p-5">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No transactions yet. Import a CSV to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Reconcile</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ transaction, candidates, matchedLabel }) => (
                  <BankTransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    candidates={candidates}
                    matchedLabel={matchedLabel}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
