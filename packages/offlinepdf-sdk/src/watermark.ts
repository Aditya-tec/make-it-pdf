import { rgb, degrees, StandardFonts } from "pdf-lib";
import { loadPdf } from "./internal/load";

export interface WatermarkOptions {
  /** Watermark text. Ignored if `image` is set. Default: "CONFIDENTIAL". */
  text?: string;
  /** Opacity from 0 to 1. Default: 0.3. */
  opacity?: number;
  /** Rotation in degrees. Default: 45. */
  rotation?: number;
  /** Font size for text watermarks. Default: 48. */
  fontSize?: number;
  /** JPEG or PNG bytes to stamp instead of text. */
  image?: Uint8Array;
}

/**
 * Stamp a text or image watermark on every page of a PDF.
 *
 * @example
 * const out = await addWatermark(file, { text: "DRAFT", opacity: 0.25, rotation: 45 });
 */
export async function addWatermark(
  file: Uint8Array,
  options: WatermarkOptions = {}
): Promise<Uint8Array> {
  const text = options.text ?? "CONFIDENTIAL";
  const opacity = Math.min(1, Math.max(0, options.opacity ?? 0.3));
  const rotation = options.rotation ?? 45;
  const fontSize = options.fontSize ?? 48;

  const src = await loadPdf(file);
  const pages = src.getPages();

  if (options.image) {
    let image;
    // try JPEG first, fall back to PNG
    try { image = await src.embedJpg(options.image); } catch { image = await src.embedPng(options.image); }
    for (const page of pages) {
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
  } else {
    const font = await src.embedFont(StandardFonts.HelveticaBold);
    for (const page of pages) {
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

  return src.save();
}
