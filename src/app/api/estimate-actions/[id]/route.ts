import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  const estimate = await prisma.estimate.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found." }, { status: 404 });
  }

  if (estimate.status === "converted") {
    return NextResponse.json({ error: "Converted estimates cannot be changed." }, { status: 409 });
  }

  if (action === "cancel") {
    await prisma.estimate.update({
      where: { id },
      data: { status: "canceled", canceledAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_accepted") {
    await prisma.estimate.update({
      where: { id },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported estimate action." }, { status: 400 });
}
