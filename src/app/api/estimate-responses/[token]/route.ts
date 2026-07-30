import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const decision = String(body.decision ?? "");
  const estimate = await prisma.estimate.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  if (estimate.status === "converted") {
    return NextResponse.json({ error: "This estimate has already been converted." }, { status: 409 });
  }
  if (estimate.status === "accepted" || estimate.status === "declined") {
    return NextResponse.json({ ok: true, status: estimate.status });
  }
  if (estimate.status === "canceled") {
    return NextResponse.json({ error: "This estimate has been canceled." }, { status: 409 });
  }
  if (estimate.expiresAt && estimate.expiresAt < new Date()) {
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "expired" },
    });
    return NextResponse.json({ error: "This estimate has expired." }, { status: 409 });
  }

  if (decision === "accept") {
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "accepted" });
  }

  if (decision === "decline") {
    await prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: "declined", declinedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "declined" });
  }

  return NextResponse.json({ error: "Choose accept or decline." }, { status: 400 });
}
