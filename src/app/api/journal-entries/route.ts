import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

type IncomingLine = { accountId: string; description: string | null; debit: number; credit: number };

function parseLines(raw: unknown): IncomingLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const line = entry as Record<string, unknown>;
      return {
        accountId: String(line.accountId ?? ""),
        description: line.description ? String(line.description).trim().slice(0, 300) : null,
        debit: Math.round(Number(line.debit) * 100) || 0,
        credit: Math.round(Number(line.credit) * 100) || 0,
      };
    })
    .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const date = new Date(String(body.date ?? ""));
  const memo = body.memo ? String(body.memo).trim().slice(0, 500) : null;
  const lines = parseLines(body.lines);

  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Enter a valid date." }, { status: 400 });
  }
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "A journal entry needs at least two lines." },
      { status: 400 }
    );
  }
  if (lines.some((line) => line.debit > 0 && line.credit > 0)) {
    return NextResponse.json(
      { error: "Each line can be a debit or a credit, not both." },
      { status: 400 }
    );
  }

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  if (totalDebit !== totalCredit) {
    return NextResponse.json(
      { error: `Debits (${totalDebit / 100}) must equal credits (${totalCredit / 100}).` },
      { status: 400 }
    );
  }

  const accountIds = [...new Set(lines.map((line) => line.accountId))];
  const ownedAccounts = await prisma.account.count({
    where: { id: { in: accountIds }, userId: user.id },
  });
  if (ownedAccounts !== accountIds.length) {
    return NextResponse.json({ error: "One or more accounts are invalid." }, { status: 400 });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      date,
      memo,
      lines: {
        create: lines.map((line, index) => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          position: index,
        })),
      },
    },
    include: { lines: { orderBy: { position: "asc" }, include: { account: true } } },
  });

  return NextResponse.json({ entry });
}
