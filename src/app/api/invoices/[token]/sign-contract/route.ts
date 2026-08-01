import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContractSignedEmail } from "@/lib/mail";
import { generateSignedAgreementPdf } from "@/lib/contract-pdf";
import { logInvoiceEvent } from "@/lib/invoice-audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    include: { user: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (!invoice.requireSignature) {
    return NextResponse.json(
      { error: "This invoice doesn't require a signature." },
      { status: 400 }
    );
  }
  if (invoice.status !== "open") {
    return NextResponse.json(
      { error: "This invoice is not currently payable." },
      { status: 400 }
    );
  }
  if (invoice.signatureData) {
    return NextResponse.json({ error: "This contract has already been signed." }, { status: 400 });
  }
  if (!invoice.senderSignatureData || !invoice.senderSignerName || !invoice.clientTerms) {
    return NextResponse.json(
      { error: "The business hasn't signed this contract yet." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const signatureData = String(body.signatureData ?? "");
  const signerName = String(body.signerName ?? "").trim().slice(0, 200);

  if (!signerName) {
    return NextResponse.json({ error: "Enter your full name to sign." }, { status: 400 });
  }
  if (!signatureData.startsWith("data:image/") || signatureData.length > 2_000_000) {
    return NextResponse.json({ error: "Provide a valid signature." }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const signatureDate = new Date();

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      signatureData,
      signerName,
      signatureDate,
      signatureIp: forwardedFor,
      signatureUserAgent: userAgent,
    },
  });

  try {
    await logInvoiceEvent({ invoiceId: invoice.id, action: "signed", metadata: { signerName } });
  } catch (error) {
    console.error("Failed to write invoice audit log", error);
  }

  // Awaited for the same reason as accept-terms: this email is the legal
  // record both parties rely on. A send failure still lets the client
  // proceed to payment -- the DB row above is the authoritative record --
  // it's only logged, not surfaced as a blocking error.
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    const publicInvoiceUrl = `${appUrl}/pay/${invoice.publicToken}`;
    const pdfBase64 = await generateSignedAgreementPdf({
      invoiceNumber: invoice.stripeNumber,
      invoiceDescription: invoice.description,
      businessName: invoice.brandBusinessName ?? "the business",
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      contractTerms: invoice.clientTerms,
      totalCents: invoice.amount,
      currency: invoice.currency,
      issueDate: invoice.createdAt,
      senderSignatureData: invoice.senderSignatureData,
      senderSignerName: invoice.senderSignerName,
      senderSignatureDate: invoice.senderSignatureDate ?? invoice.createdAt,
      signatureData,
      signerName,
      signatureDate,
    });

    await sendContractSignedEmail({
      to: invoice.clientEmail,
      recipientIsBusiness: false,
      businessName: invoice.brandBusinessName ?? "the business",
      clientName: invoice.clientName,
      invoiceDescription: invoice.description,
      invoiceNumber: invoice.stripeNumber,
      totalCents: invoice.amount,
      currency: invoice.currency,
      signerName,
      signedAt: signatureDate,
      publicInvoiceUrl,
      pdfBase64,
    });

    await sendContractSignedEmail({
      to: invoice.user.email,
      recipientIsBusiness: true,
      businessName: invoice.brandBusinessName ?? "the business",
      clientName: invoice.clientName,
      invoiceDescription: invoice.description,
      invoiceNumber: invoice.stripeNumber,
      totalCents: invoice.amount,
      currency: invoice.currency,
      signerName,
      signedAt: signatureDate,
      publicInvoiceUrl,
      pdfBase64,
    });
  } catch (error) {
    console.error("Failed to send contract-signed email", error);
  }

  return NextResponse.json({ ok: true, signatureDate });
}
