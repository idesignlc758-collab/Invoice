import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const REASONS = ["purchase", "sale", "adjustment", "return"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await request.json();

  const quantityChange = Math.round(Number(body.quantityChange));
  const reason = String(body.reason ?? "");
  const notes = body.notes ? String(body.notes).trim().slice(0, 500) : null;

  if (!Number.isFinite(quantityChange) || quantityChange === 0) {
    return NextResponse.json({ error: "Enter a non-zero quantity change." }, { status: 400 });
  }
  if (!REASONS.includes(reason)) {
    return NextResponse.json({ error: "Choose a valid reason." }, { status: 400 });
  }

  const item = await prisma.inventoryItem.findFirst({ where: { id, userId: user.id } });
  if (!item) {
    return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });
  }

  const [, updated] = await prisma.$transaction([
    prisma.inventoryAdjustment.create({
      data: { inventoryItemId: item.id, quantityChange, reason, notes },
    }),
    prisma.inventoryItem.update({
      where: { id: item.id },
      data: { quantityOnHand: { increment: quantityChange } },
    }),
  ]);

  return NextResponse.json({ item: updated });
}
