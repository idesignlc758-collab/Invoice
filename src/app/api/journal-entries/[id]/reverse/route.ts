import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// Journal entries aren't edited or deleted once posted -- correcting one
// means posting a reversing entry with every line's debit/credit swapped,
// which is the standard bookkeeping way to back out a mistake without
// destroying the audit trail.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  const original = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id },
    include: { lines: true, reversedBy: true },
  });
  if (!original) {
    return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
  }
  if (original.reversedBy) {
    return NextResponse.json({ error: "This entry has already been reversed." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const date = body.date ? new Date(String(body.date)) : new Date();

  const reversal = await prisma.journalEntry.create({
    data: {
      userId: user.id,
      date: Number.isNaN(date.getTime()) ? new Date() : date,
      memo: `Reversal of ${original.memo ?? original.id}`,
      reversalOfId: original.id,
      lines: {
        create: original.lines.map((line, index) => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.credit,
          credit: line.debit,
          position: index,
        })),
      },
    },
    include: { lines: { orderBy: { position: "asc" }, include: { account: true } } },
  });

  return NextResponse.json({ entry: reversal });
}
