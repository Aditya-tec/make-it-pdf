import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { calc, money, type PosItem } from "@/lib/pos";
import { ascii } from "./tableToPdf";

type Row = { l?: string; r?: string; bold?: boolean; center?: boolean; size?: number; rule?: boolean };

const WIDTHS = { a4: 595.28, "80mm": 226.77, "58mm": 164.41 } as const;
type Width = keyof typeof WIDTHS;

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    let w = word;
    while (font.widthOfTextAtSize(w, size) > max && w.length > 1) {
      // break an over-long word
      let n = w.length - 1;
      while (n > 1 && font.widthOfTextAtSize(w.slice(0, n), size) > max) n--;
      if (line) {
        out.push(line);
        line = "";
      }
      out.push(w.slice(0, n));
      w = w.slice(n);
    }
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= max) line = next;
    else {
      if (line) out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out;
}

const pct = (n: number) => String(+n.toFixed(2));

export async function run(
  _files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const items = (opts.items ?? []) as PosItem[];
  const inclusive = opts.inclusive === true;
  const interState = opts.interState === true;
  const width: Width = (opts.width as Width) in WIDTHS ? (opts.width as Width) : "80mm";
  const shop = ascii(String(opts.shop ?? "")).trim().slice(0, 60) || "Receipt";
  const receiptNo = ascii(String(opts.receiptNo ?? "")).trim().slice(0, 20);

  onProgress(20, "Calculating…");
  const t = calc(items, inclusive);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageW = WIDTHS[width];
  const thermal = width !== "a4";
  const base = width === "58mm" ? 7 : thermal ? 8 : 10;
  const contentW = thermal ? pageW - 16 : 340;
  const x0 = (pageW - contentW) / 2;

  const rows: Row[] = [];
  const now = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
  for (const l of wrap(shop, bold, base + 3, contentW)) rows.push({ l, bold: true, center: true, size: base + 3 });
  rows.push({ l: receiptNo ? `Receipt ${receiptNo}  ${stamp}` : stamp, center: true }, { rule: true });
  for (const line of t.lines) {
    const label = wrap(ascii(line.name), font, base, contentW);
    label.forEach((s) => rows.push({ l: s }));
    rows.push({ l: `  ${line.qty} x ${money(line.unit)}${line.rate ? `  GST ${pct(line.rate)}%` : ""}`, r: money(inclusive ? line.total : line.taxable) });
  }
  rows.push({ rule: true });
  rows.push({ l: inclusive ? "Taxable value" : "Subtotal", r: money(t.taxable) });
  for (const s of t.slabs) {
    if (!s.rate) continue;
    if (interState) rows.push({ l: `IGST @${pct(s.rate)}%`, r: money(s.gst) });
    else {
      rows.push({ l: `CGST @${pct(s.rate / 2)}%`, r: money(s.cgst) });
      rows.push({ l: `SGST @${pct(s.rate / 2)}%`, r: money(s.sgst) });
    }
  }
  rows.push({ rule: true }, { l: "TOTAL", r: money(t.total), bold: true, size: base + 3 }, { rule: true });
  rows.push({ l: inclusive ? "Prices include GST" : "GST added to prices", center: true });
  rows.push({ l: "Thank you!", center: true });
  rows.push({ l: "Simplified receipt - not a GST tax invoice", center: true, size: base - 1 });

  const lh = (r: Row) => (r.size ?? base) * 1.35 + (r.rule ? -2 : 0);
  const margin = thermal ? 10 : 56;
  const pageH = thermal ? Math.max(120, rows.reduce((n, r) => n + lh(r), margin * 2)) : 841.89;

  onProgress(60, "Drawing receipt…");
  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;
  for (const r of rows) {
    const h = lh(r);
    if (!thermal && y - h < margin) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    y -= h;
    if (r.rule) {
      page.drawLine({ start: { x: x0, y: y + h / 2 }, end: { x: x0 + contentW, y: y + h / 2 }, thickness: 0.5, color: rgb(0.2, 0.2, 0.2) });
      continue;
    }
    const f = r.bold ? bold : font;
    const size = r.size ?? base;
    if (r.l) {
      const x = r.center ? x0 + (contentW - f.widthOfTextAtSize(r.l, size)) / 2 : x0;
      page.drawText(r.l, { x, y: y + 2, size, font: f });
    }
    if (r.r) page.drawText(r.r, { x: x0 + contentW - f.widthOfTextAtSize(r.r, size), y: y + 2, size, font: f });
  }

  const bytes = await doc.save();
  onProgress(100);
  return [{ name: "receipt.pdf", bytes }];
}
