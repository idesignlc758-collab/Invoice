import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const name = String(body.name ?? "").trim().slice(0, 200);
  const sku = body.sku ? String(body.sku).trim().slice(0, 100) : null;
  const quantityOnHand = Math.round(Number(body.quantityOnHand)) || 0;
  const unitCost = Math.round(Number(body.unitCost) * 100) || 0;
  const reorderPoint = Math.round(Number(body.reorderPoint)) || 0;
  const productId = body.productId ? String(body.productId) : null;

  if (!name) {
    return NextResponse.json({ error: "Enter an item name." }, { status: 400 });
  }
  if (productId) {
    const owned = await prisma.product.findFirst({ where: { id: productId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const item = await prisma.inventoryItem.create({
    data: { userId: user.id, name, sku, quantityOnHand, unitCost, reorderPoint, productId },
  });

  return NextResponse.json({ item });
}
