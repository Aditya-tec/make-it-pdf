import { rgb, StandardFonts } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

function clip(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const header = clip(String(opts.header ?? ""), 120);
  const footer = clip(String(opts.footer ?? ""), 120);
  const includePage = Boolean(opts.includePage);
  const includeDate = Boolean(opts.includeDate);
  const fontSize = Math.min(18, Math.max(8, Number(opts.fontSize ?? 10)));
  const margin = 24;
  const dateStr = includeDate ? new Date().toISOString().slice(0, 10) : "";

  onProgress(10, "Loading…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());
  const pages = src.getPages();
  const font = await src.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < pages.length; i++) {
    onProgress(10 + Math.round((i / pages.length) * 80), `Page ${i + 1}…`);
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

  onProgress(95, "Saving…");
  const bytes = await src.save();
  onProgress(100);
  return [{ name: "headers-footers.pdf", bytes }];
}
