import PDFDocument from "pdfkit";
import { formatCents } from "./format";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  return Buffer.from(base64, "base64");
}

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export type SignedAgreementInput = {
  invoiceNumber: string | null;
  invoiceDescription: string;
  businessName: string;
  clientName: string | null;
  clientEmail: string;
  contractTerms: string;
  totalCents: number;
  currency: string;
  issueDate: Date;
  senderSignatureData: string;
  senderSignerName: string;
  senderSignatureDate: Date;
  signatureData: string;
  signerName: string;
  signatureDate: Date;
};

// Rebuilds the signed contract as a standalone PDF -- the durable record
// attached to the "contract signed" email, independent of the database row.
export async function generateSignedAgreementPdf(input: SignedAgreementInput): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#141414").text("Signed Agreement");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#6b6b6b")
      .text(
        input.invoiceNumber
          ? `Invoice ${input.invoiceNumber} - ${formatCents(input.totalCents, input.currency)}`
          : formatCents(input.totalCents, input.currency)
      );
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica-Bold").fillColor("#141414").text("Between");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`${input.businessName} ("Business")`)
      .text(`${input.clientName ? `${input.clientName} - ` : ""}${input.clientEmail} ("Client")`);
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#6b6b6b")
      .text(`For: ${input.invoiceDescription}`)
      .text(`Issued ${formatTimestamp(input.issueDate)}`);
    doc.moveDown(1.2);

    doc.fontSize(13).font("Helvetica-Bold").fillColor("#141414").text("Contract Terms");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").fillColor("#333333").text(input.contractTerms, {
      lineGap: 2,
    });
    doc.moveDown(1.2);

    const signatureBlockHeight = 130;
    if (doc.y + signatureBlockHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }

    doc.fontSize(13).font("Helvetica-Bold").fillColor("#141414").text("Signatures");
    doc.moveDown(0.5);

    const columnWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right - 24) / 2;
    const leftX = doc.page.margins.left;
    const rightX = leftX + columnWidth + 24;
    const top = doc.y;

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#6b6b6b").text("BUSINESS", leftX, top, {
      width: columnWidth,
    });
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#6b6b6b").text("CLIENT", rightX, top, {
      width: columnWidth,
    });

    const imageY = top + 16;
    doc.image(dataUrlToBuffer(input.senderSignatureData), leftX, imageY, {
      fit: [columnWidth, 60],
    });
    doc.image(dataUrlToBuffer(input.signatureData), rightX, imageY, {
      fit: [columnWidth, 60],
    });

    const detailsY = imageY + 66;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#141414")
      .text(input.senderSignerName, leftX, detailsY, { width: columnWidth });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#6b6b6b")
      .text(formatTimestamp(input.senderSignatureDate), leftX, doc.y, { width: columnWidth });

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#141414")
      .text(input.signerName, rightX, detailsY, { width: columnWidth });
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#6b6b6b")
      .text(formatTimestamp(input.signatureDate), rightX, doc.y, { width: columnWidth });

    doc.moveDown(2);
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#9a9a9a")
      .text(
        `This document was electronically signed on ${formatTimestamp(input.signatureDate)}. Both parties have received a copy.`,
        leftX,
        doc.y,
        { width: columnWidth * 2 + 24 }
      );

    doc.end();
  });
}
