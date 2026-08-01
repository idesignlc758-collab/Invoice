import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/account-constants";

export async function POST() {
  const user = await getCurrentUser();

  const existingCount = await prisma.account.count({ where: { userId: user.id } });
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "You already have accounts. Add new ones individually instead." },
      { status: 409 }
    );
  }

  await prisma.account.createMany({
    data: DEFAULT_CHART_OF_ACCOUNTS.map((account) => ({ ...account, userId: user.id })),
  });

  return NextResponse.json({ ok: true, count: DEFAULT_CHART_OF_ACCOUNTS.length });
}
