import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

function parseAmount(value: unknown) {
  const amount = Math.round(Number(value) * 100);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const unitAmount = parseAmount(body.unitAmount);
  const description = body.description ? String(body.description).trim() : null;
  const type = String(body.type ?? "service").trim() || "service";
  const taxable = body.taxable === undefined ? true : Boolean(body.taxable);
  const currency = "usd";

  if (!name || !unitAmount) {
    return NextResponse.json(
      { error: "Enter a product name and a valid price." },
      { status: 400 }
    );
  }

  let stripeCatalog:
    | { stripeProductId: string; stripePriceId: string }
    | { stripeProductId: null; stripePriceId: null } = {
    stripeProductId: null,
    stripePriceId: null,
  };

  try {
    const stripeProduct = await stripe.products.create({
      name,
      description: description ?? undefined,
      metadata: { userId: user.id },
    });
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitAmount,
      currency,
      metadata: { userId: user.id },
    });
    stripeCatalog = {
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    };
  } catch {
    // Local catalog remains usable if Stripe catalog sync is unavailable.
  }

  const product = await prisma.product.upsert({
    where: { userId_name: { userId: user.id, name } },
    update: {
      description,
      unitAmount,
      currency,
      type,
      taxable,
      active: true,
      ...stripeCatalog,
    },
    create: {
      userId: user.id,
      name,
      description,
      unitAmount,
      currency,
      type,
      taxable,
      ...stripeCatalog,
    },
  });

  return NextResponse.json({ product });
}
