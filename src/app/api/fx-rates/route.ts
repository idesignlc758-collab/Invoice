import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const fromCurrency = String(body.fromCurrency ?? "").trim().toLowerCase().slice(0, 3);
  const toCurrency = String(body.toCurrency ?? "").trim().toLowerCase().slice(0, 3);
  const rate = Number(body.rate);
  const asOf = new Date(String(body.asOf ?? ""));

  if (fromCurrency.length !== 3 || toCurrency.length !== 3 || fromCurrency === toCurrency) {
    return NextResponse.json({ error: "Enter two different 3-letter currency codes." }, { status: 400 });
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    return NextResponse.json({ error: "Enter a valid exchange rate." }, { status: 400 });
  }
  if (Number.isNaN(asOf.getTime())) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }

  const fxRate = await prisma.fxRate.upsert({
    where: { userId_fromCurrency_toCurrency_asOf: { userId: user.id, fromCurrency, toCurrency, asOf } },
    update: { rate },
    create: { userId: user.id, fromCurrency, toCurrency, rate, asOf },
  });

  return NextResponse.json({ fxRate });
}
