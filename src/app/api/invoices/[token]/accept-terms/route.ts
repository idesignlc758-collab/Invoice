import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTermsAgreementEmail } from "@/lib/mail";
import { generateLegalAgreementPdf } from "@/lib/legal-pdf";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      status: true,
      clientEmail: true,
      clientName: true,
      description: true,
      amount: true,
      currency: true,
      brandBusinessName: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (invoice.status !== "open") {
    return NextResponse.json(
      { error: "This invoice is not currently payable." },
      { status: 400 }
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;
  const agreedAt = new Date();

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      termsAcceptedAt: agreedAt,
      termsAcceptedIp: forwardedFor,
      termsAcceptedUserAgent: userAgent,
    },
  });

  // Awaited rather than fire-and-forget: on a serverless function, work left
  // running after the response is sent isn't guaranteed to finish, and this
  // email is the legal record the client relies on -- a silent failure here
  // is exactly what we can't afford. A send failure still lets the client
  // proceed to payment (the DB record above is the authoritative one); it's
  // only logged, not surfaced as a blocking error.
  try {
    const pdfBase64 = await generateLegalAgreementPdf();
    await sendTermsAgreementEmail({
      to: invoice.clientEmail,
      clientName: invoice.clientName,
      businessName: invoice.brandBusinessName ?? "the business",
      invoiceDescription: invoice.description,
      totalCents: invoice.amount,
      currency: invoice.currency,
      agreedAt,
      pdfBase64,
    });
  } catch (error) {
    console.error("Failed to send terms-agreement email", error);
  }

  return NextResponse.json({ ok: true });
}
