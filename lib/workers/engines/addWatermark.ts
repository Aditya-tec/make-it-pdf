import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const text = (opts.text as string) || "CONFIDENTIAL";
  const opacity = Math.min(1, Math.max(0, Number(opts.opacity ?? 0.3)));
  const rotation = Number(opts.rotation ?? 45);
  const fontSize = Number(opts.fontSize ?? 48);
  const imageBytes = opts.imageBytes as Uint8Array | undefined;

  onProgress(10, "Loading document…");
  const src = await loadPdf(files[0]);
  const pages = src.getPages();
  let image;
  if (imageBytes) {
    // try JPEG first, fall back to PNG
    try { image = await src.embedJpg(imageBytes); } catch { image = await src.embedPng(imageBytes); }
  } else {
    const font = await src.embedFont(StandardFonts.HelveticaBold);
    for (let i = 0; i < pages.length; i++) {
      onProgress(10 + Math.round((i / pages.length) * 80), `Watermarking page ${i + 1}…`);
      const page = pages[i];
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height / 2 - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity,
        rotate: degrees(rotation),
      });
    }
  }

  if (image) {
    for (let i = 0; i < pages.length; i++) {
      onProgress(10 + Math.round((i / pages.length) * 80), `Watermarking page ${i + 1}…`);
      const page = pages[i];
      const { width, height } = page.getSize();
      const scale = Math.min((width * 0.5) / image.width, (height * 0.5) / image.height);
      const iw = image.width * scale;
      const ih = image.height * scale;
      page.drawImage(image, {
        x: (width - iw) / 2,
        y: (height - ih) / 2,
        width: iw,
        height: ih,
        opacity,
        rotate: degrees(rotation),
      });
    }
  }

  onProgress(95, "Saving…");
  const bytes = await src.save();
  onProgress(100);
  return [{ name: "watermarked.pdf", bytes }];
}
