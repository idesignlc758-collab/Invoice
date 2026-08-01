import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORIES } from "@/lib/expense-constants";

type IncomingLine = { category: string; monthlyAmountCents: number };

function parseLines(raw: unknown): IncomingLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const line = entry as Record<string, unknown>;
      return {
        category: String(line.category ?? ""),
        monthlyAmountCents: Math.round(Number(line.monthlyAmount) * 100) || 0,
      };
    })
    .filter(
      (line) =>
        EXPENSE_CATEGORIES.includes(line.category as (typeof EXPENSE_CATEGORIES)[number]) &&
        line.monthlyAmountCents > 0
    );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const name = String(body.name ?? "").trim().slice(0, 200) || "Budget";
  const year = Math.round(Number(body.year));
  const lines = parseLines(body.lines);

  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Enter a valid year." }, { status: 400 });
  }
  if (lines.length === 0) {
    return NextResponse.json(
      { error: "Add at least one category with a monthly amount." },
      { status: 400 }
    );
  }

  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      name,
      year,
      lines: {
        create: lines.map((line) => ({
          category: line.category,
          amounts: JSON.stringify(Array(12).fill(line.monthlyAmountCents)),
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json({ budget });
}
