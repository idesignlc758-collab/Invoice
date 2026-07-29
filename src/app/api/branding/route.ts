import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function safeColor(value: unknown) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#c81010";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();
  const businessName = String(body.businessName ?? "").trim() || null;
  const logoUrl = String(body.logoUrl ?? "").trim() || null;
  const brandColor = safeColor(body.brandColor);
  const supportEmail = String(body.supportEmail ?? "").trim() || null;
  const website = String(body.website ?? "").trim() || null;
  const invoiceFooter = String(body.invoiceFooter ?? "").trim() || null;
  const defaultTermsDays = Math.min(365, Math.max(0, Math.round(Number(body.defaultTermsDays) || 0)));

  const profile = await prisma.businessProfile.upsert({
    where: { userId: user.id },
    update: {
      businessName,
      logoUrl,
      brandColor,
      supportEmail,
      website,
      invoiceFooter,
      defaultTermsDays,
    },
    create: {
      userId: user.id,
      businessName,
      logoUrl,
      brandColor,
      supportEmail,
      website,
      invoiceFooter,
      defaultTermsDays,
    },
  });

  return NextResponse.json({ profile });
}
