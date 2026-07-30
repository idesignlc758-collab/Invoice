import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function safeColor(value: unknown) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#c81010";
}

function validEmail(value: string | null) {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();
  const businessName = String(body.businessName ?? "").trim() || null;
  const logoUrl = String(body.logoUrl ?? "").trim() || null;
  const brandColor = safeColor(body.brandColor);
  const emailSenderName = String(body.emailSenderName ?? "").trim() || null;
  const replyToEmail = String(body.replyToEmail ?? "").trim().toLowerCase() || null;
  const supportEmail = String(body.supportEmail ?? "").trim() || null;
  const website = String(body.website ?? "").trim() || null;
  const addressLine1 = String(body.addressLine1 ?? "").trim() || null;
  const addressLine2 = String(body.addressLine2 ?? "").trim() || null;
  const city = String(body.city ?? "").trim() || null;
  const state = String(body.state ?? "").trim() || null;
  const postalCode = String(body.postalCode ?? "").trim() || null;
  const country = String(body.country ?? "").trim() || null;
  const invoiceFooter = String(body.invoiceFooter ?? "").trim() || null;
  const clientTerms = String(body.clientTerms ?? "").trim().slice(0, 4000) || null;
  const defaultClientNote = String(body.defaultClientNote ?? "").trim().slice(0, 1000) || null;
  const defaultTermsDays = Math.min(365, Math.max(0, Math.round(Number(body.defaultTermsDays) || 0)));

  if (!emailSenderName || !validEmail(replyToEmail)) {
    return NextResponse.json(
      { error: "Add a sender name and a valid reply-to email before saving branding." },
      { status: 400 }
    );
  }

  const profile = await prisma.businessProfile.upsert({
    where: { userId: user.id },
    update: {
      businessName,
      logoUrl,
      brandColor,
      emailSenderName,
      replyToEmail,
      supportEmail,
      website,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      invoiceFooter,
      clientTerms,
      defaultClientNote,
      defaultTermsDays,
    },
    create: {
      userId: user.id,
      businessName,
      logoUrl,
      brandColor,
      emailSenderName,
      replyToEmail,
      supportEmail,
      website,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      invoiceFooter,
      clientTerms,
      defaultClientNote,
      defaultTermsDays,
    },
  });

  return NextResponse.json({ profile });
}
