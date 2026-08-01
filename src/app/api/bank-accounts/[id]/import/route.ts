import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { parseCsv } from "@/lib/csv";

// Expects a CSV with a header row containing (in any order, case-insensitive)
// "date", "description", "amount". Amount is signed: positive = money in,
// negative = money out -- matches how most bank/card exports already work.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const account = await prisma.bankAccount.findFirst({ where: { id, userId: user.id } });
  if (!account) {
    return NextResponse.json({ error: "Bank account not found." }, { status: 404 });
  }

  const body = await request.json();
  const csvText = String(body.csv ?? "");
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json({ error: "Paste a CSV with a header row and at least one transaction." }, { status: 400 });
  }

  const header = rows[0].map((cell) => cell.trim().toLowerCase());
  const dateIdx = header.indexOf("date");
  const descIdx = header.indexOf("description");
  const amountIdx = header.indexOf("amount");

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return NextResponse.json(
      { error: 'CSV header must include "date", "description", and "amount" columns.' },
      { status: 400 }
    );
  }

  const transactions = rows
    .slice(1)
    .map((row) => {
      const date = new Date(row[dateIdx]?.trim() ?? "");
      const description = row[descIdx]?.trim() ?? "";
      const amount = Math.round(Number(row[amountIdx]?.trim().replace(/[$,]/g, "")) * 100);
      return { date, description, amount };
    })
    .filter((t) => !Number.isNaN(t.date.getTime()) && t.description && Number.isFinite(t.amount) && t.amount !== 0);

  if (transactions.length === 0) {
    return NextResponse.json({ error: "No valid rows found in that CSV." }, { status: 400 });
  }

  await prisma.bankTransaction.createMany({
    data: transactions.map((t) => ({
      userId: user.id,
      bankAccountId: account.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
    })),
  });

  return NextResponse.json({ ok: true, imported: transactions.length });
}
