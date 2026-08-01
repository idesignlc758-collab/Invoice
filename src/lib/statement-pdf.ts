import PDFDocument from "pdfkit";

export type StatementColumn = { header: string; align?: "left" | "right" };

export type StatementPdfInput = {
  title: string;
  subtitle: string;
  columns: StatementColumn[];
  rows: string[][];
  totalsRow?: string[];
};

const PAGE_LEFT = 54;
const PAGE_RIGHT = 541;

export async function generateStatementPdf(input: StatementPdfInput): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    doc.on("error", reject);

    doc.fontSize(20).font("Helvetica-Bold").fillColor("#141414").text(input.title);
    doc.fontSize(10).font("Helvetica").fillColor("#6b6b6b").text(input.subtitle);
    doc.moveDown(1);

    const tableWidth = PAGE_RIGHT - PAGE_LEFT;
    const colWidth = tableWidth / input.columns.length;
    const colX = input.columns.map((_, i) => PAGE_LEFT + i * colWidth);

    function drawRow(cells: string[], options: { bold?: boolean; color?: string } = {}) {
      const y = doc.y;
      doc
        .font(options.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9.5)
        .fillColor(options.color ?? "#333333");
      cells.forEach((cell, i) => {
        const align = input.columns[i]?.align ?? "left";
        doc.text(cell, colX[i], y, { width: colWidth - 8, align });
      });
      doc.moveDown(0.7);
    }

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#6b6b6b");
    const headerY = doc.y;
    input.columns.forEach((col, i) => {
      doc.text(col.header, colX[i], headerY, { width: colWidth - 8, align: col.align ?? "left" });
    });
    doc.y = headerY + 14;
    doc.moveTo(PAGE_LEFT, doc.y).lineTo(PAGE_RIGHT, doc.y).strokeColor("#e0e0e0").stroke();
    doc.moveDown(0.3);

    for (const row of input.rows) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 40) {
        doc.addPage();
      }
      drawRow(row);
    }

    if (input.totalsRow) {
      doc.moveDown(0.2);
      doc.moveTo(PAGE_LEFT, doc.y).lineTo(PAGE_RIGHT, doc.y).strokeColor("#e0e0e0").stroke();
      doc.moveDown(0.3);
      drawRow(input.totalsRow, { bold: true, color: "#141414" });
    }

    doc.end();
  });
}
