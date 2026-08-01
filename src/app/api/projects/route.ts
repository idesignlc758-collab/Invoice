import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const name = String(body.name ?? "").trim().slice(0, 200);
  const clientId = body.clientId ? String(body.clientId) : null;

  if (!name) {
    return NextResponse.json({ error: "Enter a project name." }, { status: 400 });
  }
  if (clientId) {
    const owned = await prisma.client.findFirst({ where: { id: clientId, userId: user.id } });
    if (!owned) return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: { userId: user.id, name, clientId },
  });

  return NextResponse.json({ project });
}
