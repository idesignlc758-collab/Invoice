import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const name = String(body.name ?? "").trim().slice(0, 200);
  const purchaseDate = new Date(String(body.purchaseDate ?? ""));
  const cost = Math.round(Number(body.cost) * 100);
  const usefulLifeMonths = Math.round(Number(body.usefulLifeMonths));
  const salvageValue = Math.round(Number(body.salvageValue) * 100) || 0;

  if (!name || Number.isNaN(purchaseDate.getTime())) {
    return NextResponse.json({ error: "Enter a name and a valid purchase date." }, { status: 400 });
  }
  if (!Number.isFinite(cost) || cost <= 0) {
    return NextResponse.json({ error: "Enter a valid cost." }, { status: 400 });
  }
  if (!Number.isFinite(usefulLifeMonths) || usefulLifeMonths <= 0) {
    return NextResponse.json({ error: "Enter a useful life in months (e.g. 36 or 60)." }, { status: 400 });
  }

  const asset = await prisma.fixedAsset.create({
    data: { userId: user.id, name, purchaseDate, cost, usefulLifeMonths, salvageValue },
  });

  return NextResponse.json({ asset });
}
