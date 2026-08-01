import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AccountManager } from "@/components/account-manager";

export default async function AccountsPage() {
  const user = await getCurrentUser();
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    orderBy: { code: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Bookkeeping foundation</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Chart of Accounts</h1>
      </div>
      <AccountManager accounts={accounts} />
    </main>
  );
}
