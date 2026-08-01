import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { generateStatementPdf } from "@/lib/statement-pdf";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") === "vendor" ? "vendor" : "customer";
  const entity = searchParams.get("entity") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!entity || !from || !to) {
    return NextResponse.json({ error: "Missing entity or date range." }, { status: 400 });
  }

  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T23:59:59`);
  const subtitle = `Period: ${formatDate(fromDate)} - ${formatDate(toDate)}`;

  let pdfBase64: string;
  let filename: string;

  if (type === "customer") {
    const client = await prisma.client.findFirst({ where: { id: entity, userId: user.id } });
    if (!client) return NextResponse.json({ error: "Client not found." }, { status: 404 });

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id, clientId: entity, createdAt: { gte: fromDate, lte: toDate } },
      orderBy: { createdAt: "asc" },
    });
    const totalCents = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidCents = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    pdfBase64 = await generateStatementPdf({
      title: `Customer Statement - ${client.name || client.email}`,
      subtitle,
      columns: [
        { header: "Date" },
        { header: "Description" },
        { header: "Total", align: "right" },
        { header: "Paid", align: "right" },
        { header: "Balance", align: "right" },
      ],
      rows: invoices.map((inv) => {
        const paid = inv.status === "paid" ? inv.amount : 0;
        return [
          formatDate(inv.createdAt),
          inv.description,
          formatCents(inv.amount),
          formatCents(paid),
          formatCents(inv.amount - paid),
        ];
      }),
      totalsRow: ["Total", "", formatCents(totalCents), formatCents(paidCents), formatCents(totalCents - paidCents)],
    });
    filename = `Statement_${(client.name || client.email).replace(/[^a-z0-9]/gi, "_")}.pdf`;
  } else {
    const expenses = await prisma.expense.findMany({
      where: { userId: user.id, vendor: entity, date: { gte: fromDate, lte: toDate } },
      orderBy: { date: "asc" },
    });
    const totalCents = expenses.reduce((sum, e) => sum + e.amount, 0);

    pdfBase64 = await generateStatementPdf({
      title: `Vendor Statement - ${entity}`,
      subtitle,
      columns: [
        { header: "Date" },
        { header: "Description" },
        { header: "Category" },
        { header: "Amount", align: "right" },
      ],
      rows: expenses.map((expense) => [
        formatDate(expense.date),
        expense.description,
        expense.category,
        formatCents(expense.amount),
      ]),
      totalsRow: ["Total", "", "", formatCents(totalCents)],
    });
    filename = `Statement_${entity.replace(/[^a-z0-9]/gi, "_")}.pdf`;
  }

  return new NextResponse(Buffer.from(pdfBase64, "base64"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
