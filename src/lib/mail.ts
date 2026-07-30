const MAILTRAP_SEND_ENDPOINT =
  process.env.MAILTRAP_SEND_ENDPOINT ?? "https://send.api.mailtrap.io/api/send";

const mailtrapToken = process.env.MAILTRAP_API_TOKEN ?? process.env.MAILTRAP_API_KEY;
const fromAddress = process.env.MAIL_FROM ?? "";
const fromName = process.env.MAIL_FROM_NAME ?? "Invoice by iDesignLC";

type MailtrapMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  fromName?: string | null;
  replyTo?: string | null;
};

function canSendMail() {
  return Boolean(mailtrapToken && fromAddress);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraph(value: string) {
  return `<p>${escapeHtml(value).replaceAll("\n", "<br/>")}</p>`;
}

async function sendMailtrapEmail(message: MailtrapMessage) {
  if (!canSendMail()) return false;

  try {
    const response = await fetch(MAILTRAP_SEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailtrapToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: fromAddress, name: message.fromName || fromName },
        to: [{ email: message.to }],
        ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Mailtrap API send failed", {
        status: response.status,
        statusText: response.statusText,
        body,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Mailtrap API send failed", error);
    return false;
  }
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
  const total = formatCents(totalCents, currency);
  const fee = formatCents(feeCents, currency);
  const net = formatCents(netCents, currency);

  await sendMailtrapEmail({
    to,
    subject: `You got paid - ${total}`,
    text:
      `${payer} paid ${total} for "${invoiceDescription}".\n\n` +
      `Platform fee: ${fee}\n` +
      `On its way to your bank: ${net}\n\n` +
      `View the payout in your Stripe dashboard.`,
    html:
      paragraph(`${payer} paid ${total} for "${invoiceDescription}".`) +
      paragraph(`Platform fee: ${fee}\nOn its way to your bank: ${net}`) +
      paragraph("View the payout in your Stripe dashboard."),
  });
}

export async function sendOnboardingReadyEmail(to: string) {
  await sendMailtrapEmail({
    to,
    subject: "You're ready to send invoices",
    text: "Your Stripe account is verified. You can now create and send invoices.",
    html: paragraph("Your Stripe account is verified. You can now create and send invoices."),
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
  senderName?: string | null;
  supportEmail?: string | null;
  replyToEmail?: string | null;
  footer?: string | null;
  clientNote?: string | null;
}) {
  const {
    to,
    clientName,
    businessName,
    invoiceDescription,
    totalCents,
    currency,
    publicInvoiceUrl,
    senderName,
    supportEmail,
    replyToEmail,
    footer,
    clientNote,
  } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const amount = formatCents(totalCents, currency);
  const replyLine = supportEmail ? `Questions? Reply to ${supportEmail}.` : "";
  const footerText =
    footer ?? "Secure payment processed by iDesignLC Agency in partnership with Stripe.";

  return sendMailtrapEmail({
    to,
    fromName: senderName,
    replyTo: replyToEmail ?? supportEmail,
    subject: `${businessName} sent you an invoice for ${amount}`,
    text:
      `${greeting}\n\n` +
      `${businessName} sent you an invoice for ${amount} for "${invoiceDescription}".\n\n` +
      (clientNote ? `${clientNote}\n\n` : "") +
      `View and pay securely: ${publicInvoiceUrl}\n\n` +
      `${replyLine}\n` +
      footerText,
    html:
      paragraph(greeting) +
      paragraph(`${businessName} sent you an invoice for ${amount} for "${invoiceDescription}".`) +
      (clientNote ? paragraph(clientNote) : "") +
      `<p><a href="${escapeHtml(publicInvoiceUrl)}">View and pay securely</a></p>` +
      (replyLine ? paragraph(replyLine) : "") +
      `<p style="color:#666;font-size:12px">${escapeHtml(footerText)}</p>`,
  });
}

export async function sendBrandedEstimateEmail(params: {
  to: string;
  clientName?: string | null;
  businessName: string;
  estimateDescription: string;
  totalCents: number;
  currency: string;
  publicEstimateUrl: string;
  senderName?: string | null;
  supportEmail?: string | null;
  replyToEmail?: string | null;
  footer?: string | null;
  clientNote?: string | null;
  expiresAt?: Date | null;
}) {
  const {
    to,
    clientName,
    businessName,
    estimateDescription,
    totalCents,
    currency,
    publicEstimateUrl,
    senderName,
    supportEmail,
    replyToEmail,
    footer,
    clientNote,
    expiresAt,
  } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const amount = formatCents(totalCents, currency);
  const replyLine = supportEmail ? `Questions? Reply to ${supportEmail}.` : "";
  const expiryLine = expiresAt
    ? `This estimate is valid until ${new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(expiresAt)}.`
    : "";
  const footerText =
    footer ??
    "Estimate prepared by the service provider. Payment will be processed securely after invoice approval.";

  return sendMailtrapEmail({
    to,
    fromName: senderName,
    replyTo: replyToEmail ?? supportEmail,
    subject: `${businessName} sent you an estimate for ${amount}`,
    text:
      `${greeting}\n\n` +
      `${businessName} sent you an estimate for ${amount} for "${estimateDescription}".\n\n` +
      (clientNote ? `${clientNote}\n\n` : "") +
      (expiryLine ? `${expiryLine}\n\n` : "") +
      `Review the estimate: ${publicEstimateUrl}\n\n` +
      `${replyLine}\n` +
      footerText,
    html:
      paragraph(greeting) +
      paragraph(`${businessName} sent you an estimate for ${amount} for "${estimateDescription}".`) +
      (clientNote ? paragraph(clientNote) : "") +
      (expiryLine ? paragraph(expiryLine) : "") +
      `<p><a href="${escapeHtml(publicEstimateUrl)}">Review the estimate</a></p>` +
      (replyLine ? paragraph(replyLine) : "") +
      `<p style="color:#666;font-size:12px">${escapeHtml(footerText)}</p>`,
  });
}
