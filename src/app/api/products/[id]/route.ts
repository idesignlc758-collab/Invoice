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

  const product = await prisma.product.updateMany({
    where: { id, userId: user.id },
    data: {
      active: body.active === undefined ? undefined : Boolean(body.active),
      taxable: body.taxable === undefined ? undefined : Boolean(body.taxable),
      type: body.type === undefined ? undefined : String(body.type),
    },
  });

  if (product.count === 0) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
