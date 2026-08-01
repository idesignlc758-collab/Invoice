import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { BankAccountManager } from "@/components/bank-account-manager";

export default async function BankingPage() {
  const user = await getCurrentUser();
  // Archived accounts stay listed (dimmed) so they can be reopened --
  // filtering them out here would make them unreachable to restore.
  const accounts = await prisma.bankAccount.findMany({
    where: { userId: user.id },
    include: { transactions: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  const rows = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    accountType: account.accountType,
    last4: account.last4,
    balanceCents:
      account.startingBalance + account.transactions.reduce((sum, t) => sum + t.amount, 0),
    unreconciledCount: account.transactions.filter((t) => !t.isReconciled).length,
    isActive: account.isActive,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Manual tracking + CSV import</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Banking</h1>
      </div>
      <BankAccountManager accounts={rows} />
    </main>
  );
}
