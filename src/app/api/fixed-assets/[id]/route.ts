import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;
  const body = await request.json();

  if (body.isDisposed !== true) {
    return NextResponse.json({ error: "The only supported update is marking an asset disposed." }, { status: 400 });
  }

  const result = await prisma.fixedAsset.updateMany({
    where: { id, userId: user.id },
    data: { isDisposed: true, disposedAt: new Date() },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
