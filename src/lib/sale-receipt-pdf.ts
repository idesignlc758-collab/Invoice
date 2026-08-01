import PDFDocument from "pdfkit";
import { formatCents } from "./format";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}

export type SaleReceiptPdfInput = {
  receiptNumber: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  saleDate: Date;
  items: { description: string; quantity: number; unitAmount: number; amount: number }[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  currency: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
};

export async function generateSaleReceiptPdf(input: SaleReceiptPdfInput): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#141414").text("Sale Receipt");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#6b6b6b")
      .text(`Receipt ${input.receiptNumber} - ${formatDate(input.saleDate)}`);
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#141414").text(input.businessName);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Sold to: ${input.customerName} (${input.customerEmail})`);
    doc.moveDown(1);

    const tableTop = doc.y;
    const colDesc = 54;
    const colQty = 330;
    const colRate = 390;
    const colAmount = 470;

    doc
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#6b6b6b")
      .text("DESCRIPTION", colDesc, tableTop)
      .text("QTY", colQty, tableTop)
      .text("RATE", colRate, tableTop)
      .text("AMOUNT", colAmount, tableTop);
    doc.moveDown(0.5);
    doc
      .moveTo(colDesc, doc.y)
      .lineTo(541, doc.y)
      .strokeColor("#e0e0e0")
      .stroke();
    doc.moveDown(0.3);

    doc.font("Helvetica").fontSize(10).fillColor("#333333");
    for (const item of input.items) {
      const rowY = doc.y;
      doc.text(item.description, colDesc, rowY, { width: colQty - colDesc - 10 });
      doc.text(String(item.quantity), colQty, rowY);
      doc.text(formatCents(item.unitAmount, input.currency), colRate, rowY);
      doc.text(formatCents(item.amount, input.currency), colAmount, rowY);
      doc.moveDown(0.6);
    }

    doc.moveDown(0.5);
    doc.moveTo(colRate, doc.y).lineTo(541, doc.y).strokeColor("#e0e0e0").stroke();
    doc.moveDown(0.4);

    const totalsX = colRate;
    doc.fontSize(10).fillColor("#333333");
    doc.text("Subtotal", totalsX, doc.y, { continued: false });
    doc.text(formatCents(input.subtotal, input.currency), colAmount, doc.y - 12);
    if (input.taxAmount > 0) {
      doc.text(`Tax (${input.taxPercent}%)`, totalsX, doc.y);
      doc.text(formatCents(input.taxAmount, input.currency), colAmount, doc.y - 12);
    }
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#141414");
    doc.text("Total", totalsX, doc.y);
    doc.text(formatCents(input.total, input.currency), colAmount, doc.y - 13);
    doc.moveDown(1.5);

    if (input.paymentMethod) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#333333")
        .text(
          `Paid via ${input.paymentMethod}${input.paymentReference ? ` - ref ${input.paymentReference}` : ""}`
        );
      doc.moveDown(0.5);
    }

    if (input.notes) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#141414").text("Notes");
      doc.font("Helvetica").fontSize(10).fillColor("#333333").text(input.notes);
    }

    doc.end();
  });
}
