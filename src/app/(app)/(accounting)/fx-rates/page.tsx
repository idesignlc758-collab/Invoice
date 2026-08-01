import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { FxRateManager } from "@/components/fx-rate-manager";

export default async function FxRatesPage() {
  const user = await getCurrentUser();
  const rates = await prisma.fxRate.findMany({
    where: { userId: user.id },
    orderBy: { asOf: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Manual rates, for consolidated reporting</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Exchange Rates</h1>
      </div>
      <FxRateManager rates={rates} />
    </main>
  );
}
