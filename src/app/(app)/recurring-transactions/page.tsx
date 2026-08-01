import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { RecurringTransactionManager } from "@/components/recurring-transaction-manager";

export default async function RecurringTransactionsPage() {
  const user = await getCurrentUser();
  const items = await prisma.recurringTransaction.findMany({
    where: { userId: user.id },
    orderBy: { nextOccurrence: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Auto-logged expenses on a schedule</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Recurring Transactions</h1>
      </div>
      <RecurringTransactionManager items={items} />
    </main>
  );
}
