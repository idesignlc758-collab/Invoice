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

  const result = await prisma.employee.updateMany({
    where: { id, userId: user.id },
    data: {
      isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
      endDate: body.isActive === false ? new Date() : undefined,
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
