import type { PDFPageProxy } from "pdfjs-dist";

export type PageItem = { str: string; x: number; y: number; w: number; h: number; family: "serif" | "sans-serif" | "monospace" };

/** Text runs of one page in PDF user space (origin bottom-left). */
export async function pageItems(page: PDFPageProxy): Promise<PageItem[]> {
  const c = await page.getTextContent();
  const out: PageItem[] = [];
  for (const raw of c.items) {
    if (!("str" in raw) || !raw.str.trim()) continue;
    const t = raw.transform;
    const size = Math.abs(t[3]) || raw.height || 10;
    const fam = (c.styles[raw.fontName]?.fontFamily ?? "sans-serif").toLowerCase();
    out.push({
      str: raw.str,
      x: t[4],
      y: t[5],
      w: raw.width,
      h: size,
      family: fam.includes("mono") ? "monospace" : fam.includes("serif") && !fam.includes("sans") ? "serif" : "sans-serif",
    });
  }
  return out;
}

/** Warning for pages that yielded no text in an otherwise-readable PDF (mixed scanned/text files). */
export const emptyPagesWarning = (empty: number[], total: number) =>
  `${empty.length} of ${total} pages had no readable text (likely scanned images or drawings) and came out empty: page${empty.length > 1 ? "s" : ""} ${empty.join(", ")}. Run OCR PDF on the original first if you need those pages.`;
