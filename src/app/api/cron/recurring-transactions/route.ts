import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeNextOccurrence, type RecurringFrequency } from "@/lib/recurrence";

export const runtime = "nodejs";

// Triggered daily by Vercel Cron (see vercel.json), same CRON_SECRET pattern
// as /api/cron/payment-reminders.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const due = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextOccurrence: { lte: today } },
  });

  let createdCount = 0;
  for (const template of due) {
    if (template.endDate && template.nextOccurrence > template.endDate) {
      await prisma.recurringTransaction.update({
        where: { id: template.id },
        data: { isActive: false },
      });
      continue;
    }

    await prisma.expense.create({
      data: {
        userId: template.userId,
        date: template.nextOccurrence,
        description: template.description,
        category: template.category,
        vendor: template.vendor,
        amount: template.amount,
        notes: `Auto-generated from recurring template "${template.templateName}"`,
      },
    });

    const nextOccurrence = computeNextOccurrence(
      template.nextOccurrence,
      template.frequency as RecurringFrequency
    );

    await prisma.recurringTransaction.update({
      where: { id: template.id },
      data: {
        lastExecutedAt: new Date(),
        nextOccurrence,
        isActive: template.endDate ? nextOccurrence <= template.endDate : true,
      },
    });

    createdCount++;
  }

  return NextResponse.json({ created: createdCount });
}
