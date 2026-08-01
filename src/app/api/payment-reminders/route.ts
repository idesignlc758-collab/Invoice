import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

function parseDaysList(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((n) => Math.round(Number(n)))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 365);
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const isEnabled = Boolean(body.isEnabled);
  const daysBeforeDue = parseDaysList(body.daysBeforeDue);
  const daysAfterDue = parseDaysList(body.daysAfterDue);

  const settings = await prisma.paymentReminderSettings.upsert({
    where: { userId: user.id },
    update: {
      isEnabled,
      daysBeforeDue: JSON.stringify(daysBeforeDue),
      daysAfterDue: JSON.stringify(daysAfterDue),
    },
    create: {
      userId: user.id,
      isEnabled,
      daysBeforeDue: JSON.stringify(daysBeforeDue),
      daysAfterDue: JSON.stringify(daysAfterDue),
    },
  });

  return NextResponse.json({ settings });
}
