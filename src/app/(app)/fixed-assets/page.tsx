import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { FixedAssetManager } from "@/components/fixed-asset-manager";
import { straightLineDepreciation } from "@/lib/depreciation";

export default async function FixedAssetsPage() {
  const user = await getCurrentUser();
  const assets = await prisma.fixedAsset.findMany({
    where: { userId: user.id },
    orderBy: { purchaseDate: "desc" },
  });

  const now = new Date();
  const rows = assets.map((asset) => {
    const depreciation = straightLineDepreciation({
      cost: asset.cost,
      salvageValue: asset.salvageValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      purchaseDate: asset.purchaseDate,
      asOf: asset.isDisposed && asset.disposedAt ? asset.disposedAt : now,
    });
    return {
      id: asset.id,
      name: asset.name,
      cost: asset.cost,
      bookValue: depreciation.bookValue,
      accumulatedDepreciation: depreciation.accumulatedDepreciation,
      isFullyDepreciated: depreciation.isFullyDepreciated,
      isDisposed: asset.isDisposed,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Straight-line depreciation, for internal tracking</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Fixed Assets</h1>
      </div>
      <FixedAssetManager assets={rows} />
    </main>
  );
}
