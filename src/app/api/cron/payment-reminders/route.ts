import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReminderEmail } from "@/lib/mail";

export const runtime = "nodejs";

function parseDaysList(value: string): number[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
}

// Triggered daily by Vercel Cron (see vercel.json). Authenticated with a
// shared secret rather than Clerk, since this is a server-to-server call
// with no signed-in user -- Vercel sets this Authorization header
// automatically when CRON_SECRET is configured on the project.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.paymentReminderSettings.findMany({ where: { isEnabled: true } });
  if (settings.length === 0) {
    return NextResponse.json({ sent: 0, message: "No users have reminders enabled." });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let sentCount = 0;

  for (const setting of settings) {
    const daysBeforeDue = parseDaysList(setting.daysBeforeDue);
    const daysAfterDue = parseDaysList(setting.daysAfterDue);
    if (daysBeforeDue.length === 0 && daysAfterDue.length === 0) continue;

    const invoices = await prisma.invoice.findMany({
      where: { userId: setting.userId, status: "open", dueDate: { not: null } },
      include: { user: true },
    });

    for (const invoice of invoices) {
      if (!invoice.dueDate) continue;
      const due = new Date(invoice.dueDate);
      due.setHours(0, 0, 0, 0);
      const daysOffset = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const matches =
        (daysOffset > 0 && daysBeforeDue.includes(daysOffset)) ||
        (daysOffset < 0 && daysAfterDue.includes(Math.abs(daysOffset))) ||
        (daysOffset === 0 && daysBeforeDue.includes(0));
      if (!matches) continue;

      const alreadySent = await prisma.paymentReminderSent.findUnique({
        where: { invoiceId_daysOffset: { invoiceId: invoice.id, daysOffset } },
      });
      if (alreadySent) continue;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      const sent = await sendPaymentReminderEmail({
        to: invoice.clientEmail,
        clientName: invoice.clientName,
        businessName: invoice.brandBusinessName ?? invoice.user.email,
        invoiceDescription: invoice.description,
        totalCents: invoice.amount,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        publicInvoiceUrl: `${appUrl}/pay/${invoice.publicToken}`,
        daysOffset,
      });

      if (sent) {
        await prisma.paymentReminderSent.create({
          data: { invoiceId: invoice.id, daysOffset },
        });
        sentCount++;
      }
    }
  }

  return NextResponse.json({ sent: sentCount });
}
