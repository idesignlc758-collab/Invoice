import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { publicToken: token },
    select: { id: true, status: true, clientTerms: true },
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

  if (!invoice.clientTerms?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      termsAcceptedAt: new Date(),
      termsAcceptedIp: forwardedFor,
      termsAcceptedUserAgent: userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
