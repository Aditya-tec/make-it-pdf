import { rgb, StandardFonts } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

type Pos = "bottom-center" | "bottom-right" | "bottom-left" | "top-center";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const format = String(opts.format ?? "n"); // n | n/N | Page n
  const start = Math.max(1, Number(opts.start ?? 1));
  const skipFirst = Boolean(opts.skipFirst);
  const pos = (opts.position as Pos) || "bottom-center";
  const fontSize = Math.min(36, Math.max(8, Number(opts.fontSize ?? 12)));
  const margin = 28;

  onProgress(10, "Loading…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());
  const pages = src.getPages();
  const font = await src.embedFont(StandardFonts.Helvetica);
  const total = pages.length;
  const numbered = skipFirst ? total - 1 : total;

  for (let i = 0; i < pages.length; i++) {
    if (skipFirst && i === 0) continue;
    onProgress(10 + Math.round((i / pages.length) * 80), `Numbering page ${i + 1}…`);
    const page = pages[i];
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
    if (pos === "bottom-left") x = margin;
    if (pos === "bottom-right") x = width - tw - margin;
    if (pos === "top-center") {
      x = (width - tw) / 2;
      y = height - margin - fontSize;
    }
    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
  }

  onProgress(95, "Saving…");
  const bytes = await src.save();
  onProgress(100);
  return [{ name: "numbered.pdf", bytes }];
}
