import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/product-manager";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id, active: true },
    orderBy: [{ timesUsed: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
      <div>
        <p className="text-sm text-muted">Reusable items</p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Products</h1>
      </div>
      <ProductManager products={products} />
    </main>
  );
}
