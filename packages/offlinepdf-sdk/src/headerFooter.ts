import { rgb, StandardFonts } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

export interface HeaderFooterOptions {
  /** Header text. Clipped to 120 characters. Omit to draw no header. */
  header?: string;
  /** Footer text. Clipped to 120 characters. Omit to draw no footer. */
  footer?: string;
  /** Draw "n / N" in the bottom-right of every page. Default: false. */
  includePageNumber?: boolean;
  /** Draw today's date (ISO, yyyy-mm-dd) in the top-right of every page. Default: false. */
  includeDate?: boolean;
  /** Font size, clamped to 8-18. Default: 10. */
  fontSize?: number;
}

function clip(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/**
 * Add a header and/or footer to every page of a PDF, with an optional date and page
 * number. A semi-transparent white band is drawn behind the text so it stays readable
 * on dark or full-bleed pages.
 *
 * @example
 * const out = await addHeaderFooter(file, {
 *   header: "Q3 Report",
 *   footer: "Confidential",
 *   includePageNumber: true,
 *   includeDate: true,
 * });
 */
export async function addHeaderFooter(
  file: Uint8Array,
  options: HeaderFooterOptions = {}
): Promise<Uint8Array> {
  const header = clip(options.header ?? "", 120);
  const footer = clip(options.footer ?? "", 120);
  const includePage = options.includePageNumber ?? false;
  const includeDate = options.includeDate ?? false;
  const fontSize = Math.min(18, Math.max(8, options.fontSize ?? 10));
  const margin = 24;
  const dateStr = includeDate ? new Date().toISOString().slice(0, 10) : "";

  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());
  const pages = src.getPages();
  const font = await src.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    // Thin white band so text doesn't sit on full-bleed content
    if (header || dateStr) {
      page.drawRectangle({
        x: 0,
        y: height - margin - fontSize - 6,
        width,
        height: margin + fontSize + 6,
        color: rgb(1, 1, 1),
        opacity: 0.85,
      });
      if (header) {
        page.drawText(header, {
          x: margin,
          y: height - margin - fontSize,
          size: fontSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
          maxWidth: width - margin * 2 - (dateStr ? 80 : 0),
        });
      }
      if (dateStr) {
        const dw = font.widthOfTextAtSize(dateStr, fontSize);
        page.drawText(dateStr, {
          x: width - margin - dw,
          y: height - margin - fontSize,
          size: fontSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
      }
    }
    if (footer || includePage) {
      page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: margin + fontSize + 6,
        color: rgb(1, 1, 1),
        opacity: 0.85,
      });
      if (footer) {
        page.drawText(footer, {
          x: margin,
          y: margin,
          size: fontSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
          maxWidth: width - margin * 2 - (includePage ? 60 : 0),
        });
      }
      if (includePage) {
        const label = `${i + 1} / ${pages.length}`;
        const tw = font.widthOfTextAtSize(label, fontSize);
        page.drawText(label, {
          x: width - margin - tw,
          y: margin,
          size: fontSize,
          font,
          color: rgb(0.25, 0.25, 0.25),
        });
      }
    }
  }

  return src.save();
}
