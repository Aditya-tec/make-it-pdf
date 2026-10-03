import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { assertOutputSize } from "./validate";

// Equal columns, text truncated with "...", first row repeated as the header on every page.
const MAX_ROWS = 20_000;
const MAX_COLS = 40;

export function ascii(s: string): string {
  return s.replace(/[^\x20-\x7e]/g, "?");
}

export async function tableToPdf(rowsIn: string[][], title?: string): Promise<Uint8Array> {
  if (rowsIn.length > MAX_ROWS) {
    throw new Error(`This file has ${rowsIn.length} rows; this function supports up to ${MAX_ROWS}. Split it and convert the parts.`);
  }
  const rows = rowsIn.map((r) => r.slice(0, MAX_COLS).map((c) => ascii(String(c ?? ""))));
  if (!rows.length || rows.every((r) => r.every((c) => !c.trim()))) throw new Error("No rows to convert.");
  const cols = Math.max(...rows.map((r) => r.length));
  const widest = Math.max(...rowsIn.map((r) => r.length));
  if (widest > MAX_COLS) {
    throw new Error(`This file has ${widest} columns; this function supports up to ${MAX_COLS}.`);
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 36;
  const size = cols > 8 ? 7 : 9;
  const rowH = size + 8;
  const colW = (pageW - margin * 2) / cols;
  const hasHeader = rows.length > 1;
  const header = hasHeader ? rows[0] : [];
  let i = hasHeader ? 1 : 0;

  const fit = (text: string, f: PDFFont) => {
    const max = colW - 6;
    if (f.widthOfTextAtSize(text, size) <= max) return text;
    const ell = "...";
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (f.widthOfTextAtSize(text.slice(0, mid) + ell, size) <= max) lo = mid;
      else hi = mid - 1;
    }
    return (lo ? text.slice(0, lo) : "") + ell;
  };

  const drawRow = (
    page: ReturnType<PDFDocument["addPage"]>,
    y: number,
    cells: string[],
    isHeader: boolean
  ) => {
    const f = isHeader ? bold : font;
    for (let c = 0; c < cols; c++) {
      const x = margin + c * colW;
      page.drawRectangle({
        x,
        y: y - rowH,
        width: colW,
        height: rowH,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.4,
        color: isHeader ? rgb(0.93, 0.93, 0.93) : undefined,
      });
      const text = fit(cells[c] ?? "", f);
      if (text) page.drawText(text, { x: x + 3, y: y - rowH + 3, size, font: f, color: rgb(0, 0, 0) });
    }
  };

  let pageNum = 0;
  while (pageNum === 0 || i < rows.length) {
    const page = doc.addPage([pageW, pageH]);
    pageNum++;
    let y = pageH - margin;
    if (title) {
      const label = ascii(title);
      const max = pageW - margin * 2;
      const shown = bold.widthOfTextAtSize(label, 10) <= max ? label : label.slice(0, 80);
      page.drawText(shown, { x: margin, y: y - 11, size: 10, font: bold, color: rgb(0, 0, 0) });
      y -= 18;
    }
    if (hasHeader) {
      drawRow(page, y, header, true);
      y -= rowH;
    }
    const before = i;
    while (i < rows.length && y - rowH > margin) {
      drawRow(page, y, rows[i], false);
      y -= rowH;
      i++;
    }
    if (i === before && i < rows.length) {
      drawRow(page, y, rows[i], false);
      i++;
    }
    if (pageNum > 2000) break;
  }

  const bytes = await doc.save();
  assertOutputSize(bytes.length);
  return bytes;
}
