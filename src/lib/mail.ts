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

function canSendMail() {
  return Boolean(
    process.env.MAILTRAP_HOST &&
      process.env.MAILTRAP_USER &&
      process.env.MAILTRAP_PASS &&
      fromAddress
  );
}

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

export async function sendBrandedInvoiceEmail(params: {
  to: string;
  clientName?: string | null;
  businessName: string;
  invoiceDescription: string;
  totalCents: number;
  currency: string;
  publicInvoiceUrl: string;
  supportEmail?: string | null;
  footer?: string | null;
  clientNote?: string | null;
}) {
  if (!canSendMail()) return false;

  const {
    to,
    clientName,
    businessName,
    invoiceDescription,
    totalCents,
    currency,
    publicInvoiceUrl,
    supportEmail,
    footer,
    clientNote,
  } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const amount = formatCents(totalCents, currency);
  const replyLine = supportEmail ? `Questions? Reply to ${supportEmail}.` : "";

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `${businessName} sent you an invoice for ${amount}`,
    text:
      `${greeting}\n\n` +
      `${businessName} sent you an invoice for ${amount} for "${invoiceDescription}".\n\n` +
      (clientNote ? `${clientNote}\n\n` : "") +
      `View and pay securely: ${publicInvoiceUrl}\n\n` +
      `${replyLine}\n` +
      `${footer ?? "Secure payment processed by iDesignLC Agency in partnership with Stripe."}`,
    html:
      `<p>${greeting}</p>` +
      `<p><strong>${businessName}</strong> sent you an invoice for <strong>${amount}</strong> for "${invoiceDescription}".</p>` +
      (clientNote ? `<p>${clientNote}</p>` : "") +
      `<p><a href="${publicInvoiceUrl}">View and pay securely</a></p>` +
      (replyLine ? `<p>${replyLine}</p>` : "") +
      `<p style="color:#666;font-size:12px">${footer ?? "Secure payment processed by iDesignLC Agency in partnership with Stripe."}</p>`,
  });

  return true;
}
