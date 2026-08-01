import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { InventoryManager } from "@/components/inventory-manager";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  const [items, products] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { userId: user.id, active: true, inventoryItem: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Stock on hand + adjustments</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Inventory</h1>
      </div>
      <InventoryManager items={items} products={products} />
    </main>
  );
}
