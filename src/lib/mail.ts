const MAILTRAP_SEND_ENDPOINT =
  process.env.MAILTRAP_SEND_ENDPOINT ?? "https://send.api.mailtrap.io/api/send";

const mailtrapToken = process.env.MAILTRAP_API_TOKEN ?? process.env.MAILTRAP_API_KEY;
const fromAddress = process.env.MAIL_FROM ?? "";
const fromName = process.env.MAIL_FROM_NAME ?? "Invoice by iDesignLC";

type MailtrapAttachment = {
  filename: string;
  content: string; // base64-encoded
  type: string; // MIME type
};

type MailtrapMessage = {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html: string;
  fromName?: string | null;
  replyTo?: string | null;
  attachments?: MailtrapAttachment[];
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
        ...(message.cc?.length ? { cc: message.cc.map((email) => ({ email })) } : {}),
        ...(message.bcc?.length ? { bcc: message.bcc.map((email) => ({ email })) } : {}),
        ...(message.replyTo ? { reply_to: { email: message.replyTo } } : {}),
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.attachments?.length
          ? {
              attachments: message.attachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                type: attachment.type,
                disposition: "attachment",
              })),
            }
          : {}),
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
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
  cc?: string[];
  bcc?: string[];
  clientName?: string | null;
  businessName: string;
  invoiceDescription: string;
  totalCents: number;
  currency: string;
  publicInvoiceUrl: string;
  lineItems?: { description: string; quantity: number; amountCents: number }[];
  dueDate?: Date | null;
  brandColor?: string | null;
  logoUrl?: string | null;
  senderName?: string | null;
  supportEmail?: string | null;
  replyToEmail?: string | null;
  footer?: string | null;
  clientNote?: string | null;
}) {
  const {
    to,
    cc,
    bcc,
    clientName,
    businessName,
    invoiceDescription,
    totalCents,
    currency,
    publicInvoiceUrl,
    lineItems = [],
    dueDate,
    brandColor,
    logoUrl,
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
  const safeBrandColor =
    brandColor && /^#[0-9a-f]{6}$/i.test(brandColor) ? brandColor : "#d30b0b";
  const dueLine = dueDate ? `Due ${formatDate(dueDate)}` : "Due on receipt";
  const visibleItems = lineItems.slice(0, 6);
  const moreItemCount = Math.max(0, lineItems.length - visibleItems.length);
  const itemText =
    lineItems.length > 0
      ? lineItems
          .map(
            (item) =>
              `- ${item.description}${item.quantity > 1 ? ` x ${item.quantity}` : ""}: ${formatCents(
                item.amountCents,
                currency
              )}`
          )
          .join("\n")
      : `- ${invoiceDescription}: ${amount}`;
  const itemRows =
    visibleItems.length > 0
      ? visibleItems
          .map(
            (item) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #eeeeee;color:#171717;font-size:14px;">
                  ${escapeHtml(item.description)}
                  ${
                    item.quantity > 1
                      ? `<span style="color:#737373;"> x ${item.quantity}</span>`
                      : ""
                  }
                </td>
                <td align="right" style="padding:12px 0;border-bottom:1px solid #eeeeee;color:#171717;font-size:14px;font-weight:700;">
                  ${escapeHtml(formatCents(item.amountCents, currency))}
                </td>
              </tr>`
          )
          .join("")
      : `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eeeeee;color:#171717;font-size:14px;">
              ${escapeHtml(invoiceDescription)}
            </td>
            <td align="right" style="padding:12px 0;border-bottom:1px solid #eeeeee;color:#171717;font-size:14px;font-weight:700;">
              ${escapeHtml(amount)}
            </td>
          </tr>`;

  return sendMailtrapEmail({
    to,
    cc,
    bcc,
    fromName: senderName,
    replyTo: replyToEmail ?? supportEmail,
    subject: `${businessName} sent you an invoice for ${amount}`,
    text:
      `${greeting}\n\n` +
      `${businessName} sent you an invoice for ${amount}.\n` +
      `${dueLine}\n\n` +
      `${itemText}\n\n` +
      (clientNote ? `${clientNote}\n\n` : "") +
      `View and pay securely: ${publicInvoiceUrl}\n\n` +
      `${replyLine}\n` +
      footerText,
    html: `
      <div style="margin:0;background:#f7f7f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#171717;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
          <tr>
            <td style="padding:0 0 16px;">
              <p style="margin:0;color:#737373;font-size:14px;">${escapeHtml(greeting)}</p>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;color:#171717;">${escapeHtml(
                businessName
              )} sent you an invoice</h1>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #e8e8e8;border-radius:24px;padding:24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:12px;">
                      ${
                        logoUrl
                          ? `<img src="${escapeHtml(
                              logoUrl
                            )}" alt="" width="48" height="48" style="border-radius:14px;object-fit:cover;display:block;">`
                          : `<div style="width:48px;height:48px;border-radius:14px;background:${safeBrandColor};color:#ffffff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">${escapeHtml(
                              businessName.charAt(0).toUpperCase()
                            )}</div>`
                      }
                    </div>
                  </td>
                  <td align="right" style="color:#737373;font-size:13px;">${escapeHtml(dueLine)}</td>
                </tr>
              </table>
              <p style="margin:28px 0 4px;color:#737373;font-size:14px;">Invoice total</p>
              <p style="margin:0;font-size:44px;line-height:1;font-weight:800;letter-spacing:0;color:#171717;">${escapeHtml(
                amount
              )}</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                ${itemRows}
                ${
                  moreItemCount > 0
                    ? `<tr><td colspan="2" style="padding:12px 0;color:#737373;font-size:13px;">+ ${moreItemCount} more item${
                        moreItemCount === 1 ? "" : "s"
                      }</td></tr>`
                    : ""
                }
              </table>
              ${
                clientNote
                  ? `<div style="margin-top:18px;border-radius:16px;background:#f7f7f7;padding:14px;color:#525252;font-size:14px;line-height:1.5;">${escapeHtml(
                      clientNote
                    ).replaceAll("\n", "<br/>")}</div>`
                  : ""
              }
              <a href="${escapeHtml(
                publicInvoiceUrl
              )}" style="display:block;margin-top:24px;border-radius:999px;background:${safeBrandColor};color:#ffffff;text-decoration:none;text-align:center;font-weight:800;padding:16px 20px;font-size:16px;">View and pay securely</a>
              <p style="margin:14px 0 0;text-align:center;color:#737373;font-size:12px;line-height:1.5;">Cards, Link, bank debit, and Cash App Pay may appear when enabled in Stripe.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 6px 0;color:#737373;font-size:12px;line-height:1.5;text-align:center;">
              ${replyLine ? `${escapeHtml(replyLine)}<br/>` : ""}
              ${escapeHtml(footerText)}
            </td>
          </tr>
        </table>
      </div>`,
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

// Sent to the client the moment they check the agreement box on the payment
// page (not when payment completes) -- the record needs to be timestamped to
// when they agreed, independent of whether they go on to finish paying.
export async function sendTermsAgreementEmail(params: {
  to: string;
  clientName?: string | null;
  businessName: string;
  invoiceDescription: string;
  totalCents: number;
  currency: string;
  agreedAt: Date;
  pdfBase64: string;
}) {
  const { to, clientName, businessName, invoiceDescription, totalCents, currency, agreedAt, pdfBase64 } =
    params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const amount = formatCents(totalCents, currency);
  const agreedAtText = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(agreedAt);

  await sendMailtrapEmail({
    to,
    subject: `Your agreement on file for ${businessName}'s invoice`,
    text:
      `${greeting}\n\n` +
      `This confirms that on ${agreedAtText}, you agreed to the Terms of Service, Privacy ` +
      `Policy, and Refund Policy of Invoice by iDesignLC before paying ${businessName}'s ` +
      `invoice for "${invoiceDescription}" (${amount}).\n\n` +
      `A copy of all three documents is attached to this email for your records.\n\n` +
      `Questions? Reply to this email or contact support@idesignlc.com.`,
    html:
      paragraph(greeting) +
      paragraph(
        `This confirms that on ${agreedAtText}, you agreed to the Terms of Service, Privacy ` +
          `Policy, and Refund Policy of Invoice by iDesignLC before paying ${businessName}'s ` +
          `invoice for "${invoiceDescription}" (${amount}).`
      ) +
      paragraph("A copy of all three documents is attached to this email for your records.") +
      paragraph("Questions? Reply to this email or contact support@idesignlc.com."),
    attachments: [
      {
        filename: "Invoice-Terms-Privacy-Refund-Policy.pdf",
        content: pdfBase64,
        type: "application/pdf",
      },
    ],
  });
}

// Sent to both the client and the business owner the moment the client signs
// a required contract -- same "durable record independent of the database
// row" reasoning as sendTermsAgreementEmail, but for the business's own
// per-invoice contract terms rather than the platform's legal documents.
export async function sendContractSignedEmail(params: {
  to: string;
  recipientIsBusiness: boolean;
  businessName: string;
  clientName?: string | null;
  invoiceDescription: string;
  invoiceNumber?: string | null;
  totalCents: number;
  currency: string;
  signerName: string;
  signedAt: Date;
  publicInvoiceUrl: string;
  pdfBase64: string;
}) {
  const {
    to,
    recipientIsBusiness,
    businessName,
    clientName,
    invoiceDescription,
    invoiceNumber,
    totalCents,
    currency,
    signerName,
    signedAt,
    publicInvoiceUrl,
    pdfBase64,
  } = params;
  const amount = formatCents(totalCents, currency);
  const signedAtText = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(signedAt);
  const invoiceLabel = invoiceNumber ? `invoice ${invoiceNumber}` : `the invoice for "${invoiceDescription}"`;
  const greeting = recipientIsBusiness
    ? "Hi,"
    : clientName
      ? `Hi ${clientName},`
      : "Hi,";
  const intro = recipientIsBusiness
    ? `${signerName} signed the contract on ${invoiceLabel} (${amount}) with ${businessName} on ${signedAtText}.`
    : `This confirms that ${signerName} signed the contract on ${invoiceLabel} (${amount}) with ${businessName} on ${signedAtText}.`;

  await sendMailtrapEmail({
    to,
    subject: `Contract signed - ${invoiceLabel}`,
    text:
      `${greeting}\n\n` +
      `${intro}\n\n` +
      `A copy of the signed agreement is attached to this email for your records.\n\n` +
      `View the invoice: ${publicInvoiceUrl}`,
    html:
      paragraph(greeting) +
      paragraph(intro) +
      paragraph("A copy of the signed agreement is attached to this email for your records.") +
      `<p><a href="${escapeHtml(publicInvoiceUrl)}">View the invoice</a></p>`,
    attachments: [
      {
        filename: `Signed-Agreement-${invoiceNumber ?? "invoice"}.pdf`,
        content: pdfBase64,
        type: "application/pdf",
      },
    ],
  });
}

export async function sendPaymentReminderEmail(params: {
  to: string;
  clientName?: string | null;
  businessName: string;
  invoiceDescription: string;
  totalCents: number;
  currency: string;
  dueDate: Date | null;
  publicInvoiceUrl: string;
  daysOffset: number; // positive = days before due, negative = days after due, 0 = due today
}) {
  const {
    to,
    clientName,
    businessName,
    invoiceDescription,
    totalCents,
    currency,
    dueDate,
    publicInvoiceUrl,
    daysOffset,
  } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi,";
  const amount = formatCents(totalCents, currency);
  const dueLine = dueDate
    ? daysOffset > 0
      ? `is due in ${daysOffset} day${daysOffset === 1 ? "" : "s"} (${formatDate(dueDate)})`
      : daysOffset < 0
        ? `was due ${Math.abs(daysOffset)} day${Math.abs(daysOffset) === 1 ? "" : "s"} ago (${formatDate(dueDate)})`
        : `is due today (${formatDate(dueDate)})`
    : "is due";

  return sendMailtrapEmail({
    to,
    subject: `Reminder: ${amount} ${daysOffset < 0 ? "overdue" : "due soon"} for ${businessName}`,
    text:
      `${greeting}\n\n` +
      `This is a reminder that your invoice for "${invoiceDescription}" (${amount}) ${dueLine}.\n\n` +
      `Pay securely: ${publicInvoiceUrl}`,
    html:
      paragraph(greeting) +
      paragraph(`This is a reminder that your invoice for "${invoiceDescription}" (${amount}) ${dueLine}.`) +
      `<p><a href="${escapeHtml(publicInvoiceUrl)}">Pay securely</a></p>`,
  });
}

export async function sendSaleReceiptEmail(params: {
  to: string;
  customerName: string;
  businessName: string;
  receiptNumber: string;
  totalCents: number;
  currency: string;
  pdfBase64: string;
}) {
  const { to, customerName, businessName, receiptNumber, totalCents, currency, pdfBase64 } = params;
  const amount = formatCents(totalCents, currency);
  const greeting = customerName ? `Hi ${customerName},` : "Hi,";

  return sendMailtrapEmail({
    to,
    subject: `Receipt ${receiptNumber} from ${businessName} - ${amount}`,
    text:
      `${greeting}\n\n` +
      `Thanks for your payment of ${amount} to ${businessName}. A copy of your receipt (${receiptNumber}) is attached for your records.`,
    html:
      paragraph(greeting) +
      paragraph(
        `Thanks for your payment of ${amount} to ${businessName}. A copy of your receipt (${receiptNumber}) is attached for your records.`
      ),
    attachments: [
      {
        filename: `Receipt-${receiptNumber}.pdf`,
        content: pdfBase64,
        type: "application/pdf",
      },
    ],
  });
}
