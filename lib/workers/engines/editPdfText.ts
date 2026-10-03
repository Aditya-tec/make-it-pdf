import { rgb, StandardFonts, type PDFFont } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";

// Cover-and-redraw, NOT content-stream editing: a white box goes over the old text and the new text is
// drawn on top in a standard font. The ORIGINAL TEXT STAYS IN THE FILE underneath (still extractable) —
// use Redact PDF to remove text for real.
export type TextEdit = { page: number; x: number; y: number; w: number; h: number; text: string; family: string };

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const edits = (opts.edits ?? []) as TextEdit[];
  if (!Array.isArray(edits) || !edits.length) throw new Error("No edits to apply. Click some text and change it first.");
  if (edits.length > 5000) throw new Error("Too many edits in one go.");

  onProgress(15, "Loading PDF…");
  const doc = await loadPdf(files[0]);
  const fonts: Record<string, PDFFont> = {
    "sans-serif": await doc.embedFont(StandardFonts.Helvetica),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    monospace: await doc.embedFont(StandardFonts.Courier),
  };
  const pages = doc.getPages();

  edits.forEach((e, i) => {
    onProgress(20 + Math.round((i / edits.length) * 70), `Applying edit ${i + 1}/${edits.length}…`);
    const page = pages[e.page];
    if (!page || ![e.x, e.y, e.w, e.h].every(Number.isFinite) || e.h <= 0 || e.w < 0) throw new Error("An edit points outside the document.");
    const font = fonts[e.family] ?? fonts["sans-serif"];
    const text = String(e.text);
    try {
      font.encodeText(text);
    } catch {
      throw new Error("The new text has characters this tool can't draw yet. Use Latin letters, digits and common punctuation.");
    }
    const pad = e.h * 0.15;
    page.drawRectangle({ x: e.x - pad, y: e.y - e.h * 0.25, width: e.w + pad * 2, height: e.h * 1.25, color: rgb(1, 1, 1) });
    if (text.trim()) page.drawText(text, { x: e.x, y: e.y, size: e.h, font, color: rgb(0, 0, 0) });
  });

  const bytes = await doc.save();
  onProgress(100);
  return [{ name: "edited.pdf", bytes }];
}
