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

  const result = await prisma.recurringTransaction.updateMany({
    where: { id, userId: user.id },
    data: { isActive: body.isActive === undefined ? undefined : Boolean(body.isActive) },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Recurring transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
