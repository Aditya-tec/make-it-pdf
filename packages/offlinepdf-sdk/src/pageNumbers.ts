import { rgb, StandardFonts } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

export type PageNumberFormat = "n" | "n/N" | "Page n";
export type PageNumberPosition = "bottom-center" | "bottom-right" | "bottom-left" | "top-center";

export interface PageNumberOptions {
  /** "n" -> "3", "n/N" -> "3/10", "Page n" -> "Page 3". Default: "n". */
  format?: PageNumberFormat;
  /** Number to start counting from. Default: 1. */
  start?: number;
  /** Skip numbering the first page (e.g. a cover page). Default: false. */
  skipFirst?: boolean;
  /** Where the number sits on the page. Default: "bottom-center". */
  position?: PageNumberPosition;
  /** Font size, clamped to 8-36. Default: 12. */
  fontSize?: number;
}

/**
 * Add page numbers to every page of a PDF, with a chosen format and position.
 *
 * @example
 * const out = await addPageNumbers(file, { format: "n/N", position: "bottom-right" });
 */
export async function addPageNumbers(
  file: Uint8Array,
  options: PageNumberOptions = {}
): Promise<Uint8Array> {
  const format = options.format ?? "n";
  const start = Math.max(1, options.start ?? 1);
  const skipFirst = options.skipFirst ?? false;
  const position = options.position ?? "bottom-center";
  const fontSize = Math.min(36, Math.max(8, options.fontSize ?? 12));
  const margin = 28;

  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());
  const pages = src.getPages();
  const font = await src.embedFont(StandardFonts.Helvetica);
  const total = pages.length;
  const numbered = skipFirst ? total - 1 : total;

  pages.forEach((page, i) => {
    if (skipFirst && i === 0) return;
    const { width, height } = page.getSize();
    const n = start + (skipFirst ? i - 1 : i);
    const label =
      format === "n/N"
        ? `${n}/${start + numbered - 1}`
        : format === "Page n"
          ? `Page ${n}`
          : String(n);
    const tw = font.widthOfTextAtSize(label, fontSize);
    let x = (width - tw) / 2;
    let y = margin;
    if (position === "bottom-left") x = margin;
    if (position === "bottom-right") x = width - tw - margin;
    if (position === "top-center") {
      x = (width - tw) / 2;
      y = height - margin - fontSize;
    }
    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
  });

  return src.save();
}
