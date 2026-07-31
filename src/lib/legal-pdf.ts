import PDFDocument from "pdfkit";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, REFUND_POLICY, type LegalDocument } from "./legal-content";

function renderDocument(doc: PDFKit.PDFDocument, legalDoc: LegalDocument) {
  doc.addPage();
  doc.fontSize(20).font("Helvetica-Bold").fillColor("#141414").text(legalDoc.title);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#6b6b6b")
    .text(`Last updated ${legalDoc.lastUpdated}`);
  doc.moveDown(1.2);

  for (const section of legalDoc.sections) {
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#141414").text(section.heading);
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica").fillColor("#333333").text(section.body);
    doc.moveDown(0.8);
  }
}

// Renders Terms of Service, Privacy Policy, and Refund Policy into a single
// PDF, base64-encoded for email attachment. Content lives in legal-content.ts,
// not here -- this file only handles layout.
export async function generateLegalAgreementPdf(): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: 54,
      autoFirstPage: false,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    renderDocument(doc, TERMS_OF_SERVICE);
    renderDocument(doc, PRIVACY_POLICY);
    renderDocument(doc, REFUND_POLICY);

    doc.end();
  });
}
