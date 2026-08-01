import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

const ACCOUNT_TYPES = ["checking", "savings", "credit_card", "other"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const name = String(body.name ?? "").trim().slice(0, 200);
  const accountType = String(body.accountType ?? "");
  const last4 = body.last4 ? String(body.last4).trim().slice(0, 4) : null;
  const startingBalance = Math.round(Number(body.startingBalance) * 100) || 0;

  if (!name) {
    return NextResponse.json({ error: "Enter an account name." }, { status: 400 });
  }
  if (!ACCOUNT_TYPES.includes(accountType)) {
    return NextResponse.json({ error: "Choose a valid account type." }, { status: 400 });
  }

  const account = await prisma.bankAccount.create({
    data: { userId: user.id, name, accountType, last4, startingBalance },
  });

  return NextResponse.json({ account });
}
