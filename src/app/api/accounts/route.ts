import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/account-constants";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const code = String(body.code ?? "").trim().slice(0, 20);
  const name = String(body.name ?? "").trim().slice(0, 200);
  const type = String(body.type ?? "");
  const description = body.description ? String(body.description).trim().slice(0, 500) : null;

  if (!code || !name) {
    return NextResponse.json({ error: "Enter an account code and name." }, { status: 400 });
  }
  if (!ACCOUNT_TYPES.includes(type as (typeof ACCOUNT_TYPES)[number])) {
    return NextResponse.json({ error: "Choose a valid account type." }, { status: 400 });
  }

  const existing = await prisma.account.findUnique({
    where: { userId_code: { userId: user.id, code } },
  });
  if (existing) {
    return NextResponse.json({ error: `Account code ${code} is already in use.` }, { status: 409 });
  }

  const account = await prisma.account.create({
    data: { userId: user.id, code, name, type, description },
  });

  return NextResponse.json({ account });
}
