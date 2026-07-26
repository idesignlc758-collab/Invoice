import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT ?? 587),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const fromAddress = process.env.MAIL_FROM ?? "invoices@example.com";

function formatCents(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export async function sendInvoicePaidEmail(params: {
  to: string;
  invoiceDescription: string;
  totalCents: number;
  feeCents: number;
  currency: string;
  clientName?: string | null;
}) {
  const { to, invoiceDescription, totalCents, feeCents, currency, clientName } = params;
  const netCents = totalCents - feeCents;
  const payer = clientName || "Your client";

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `You got paid — ${formatCents(totalCents, currency)}`,
    text:
      `${payer} paid ${formatCents(totalCents, currency)} for "${invoiceDescription}".\n\n` +
      `Platform fee: ${formatCents(feeCents, currency)}\n` +
      `On its way to your bank: ${formatCents(netCents, currency)}\n\n` +
      `View the payout in your Stripe dashboard.`,
    html:
      `<p>${payer} paid <strong>${formatCents(totalCents, currency)}</strong> for "${invoiceDescription}".</p>` +
      `<p>Platform fee: ${formatCents(feeCents, currency)}<br/>` +
      `On its way to your bank: <strong>${formatCents(netCents, currency)}</strong></p>` +
      `<p>View the payout in your Stripe dashboard.</p>`,
  });
}

export async function sendOnboardingReadyEmail(to: string) {
  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "You're ready to send invoices",
    text: "Your Stripe account is verified. You can now create and send invoices.",
    html: "<p>Your Stripe account is verified. You can now create and send invoices.</p>",
  });
}
