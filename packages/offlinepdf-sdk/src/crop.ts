import { PDFDocument, PageSizes } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

export type CropMode = "margins" | "resize";
/** "contain" preserves aspect ratio (may letterbox); "stretch" fills the target and may distort. */
export type CropFit = "contain" | "stretch";
export type CropTarget = "a4" | "letter" | "keep";

export interface CropOptions {
  /** "margins" trims by percentage; "resize" draws each page onto a new target page size. Default: "margins". */
  mode?: CropMode;
  /** Fraction of page height to trim from the top, 0-0.45. Only used when mode is "margins". */
  marginTop?: number;
  /** Fraction of page width to trim from the right, 0-0.45. Only used when mode is "margins". */
  marginRight?: number;
  /** Fraction of page height to trim from the bottom, 0-0.45. Only used when mode is "margins". */
  marginBottom?: number;
  /** Fraction of page width to trim from the left, 0-0.45. Only used when mode is "margins". */
  marginLeft?: number;
  /** Target page size when mode is "resize". "keep" reuses the first page's size for every page. Default: "a4". */
  target?: CropTarget;
  /** How to fit content into the target size when mode is "resize". Default: "contain". */
  fit?: CropFit;
}

/**
 * Crop margins by percentage, or resize every page to a target page size.
 *
 * @example
 * // Trim a 5% margin on every side.
 * const trimmed = await cropPdf(file, { marginTop: 0.05, marginRight: 0.05, marginBottom: 0.05, marginLeft: 0.05 });
 *
 * @example
 * // Resize every page to A4, preserving aspect ratio.
 * const resized = await cropPdf(file, { mode: "resize", target: "a4", fit: "contain" });
 */
export async function cropPdf(file: Uint8Array, options: CropOptions = {}): Promise<Uint8Array> {
  const mode = options.mode ?? "margins";
  const fit = options.fit ?? "contain";
  const mt = Math.min(0.45, Math.max(0, options.marginTop ?? 0));
  const mr = Math.min(0.45, Math.max(0, options.marginRight ?? 0));
  const mb = Math.min(0.45, Math.max(0, options.marginBottom ?? 0));
  const ml = Math.min(0.45, Math.max(0, options.marginLeft ?? 0));
  const target = options.target ?? "a4";

  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());

  if (mode === "margins") {
    for (const page of src.getPages()) {
      const { width, height } = page.getSize();
      const crop = {
        x: width * ml,
        y: height * mb,
        width: width * (1 - ml - mr),
        height: height * (1 - mt - mb),
      };
      page.setCropBox(crop.x, crop.y, crop.width, crop.height);
      page.setMediaBox(crop.x, crop.y, crop.width, crop.height);
    }
    return src.save();
  }

  // Resize: draw each page onto a new page of the target size
  let tw: number, th: number;
  if (target === "letter") [tw, th] = PageSizes.Letter;
  else if (target === "a4") [tw, th] = PageSizes.A4;
  else {
    // keep = use first page size as target for all
    const s = src.getPage(0).getSize();
    tw = s.width;
    th = s.height;
  }

  const out = await PDFDocument.create();
  const count = src.getPageCount();
  const embedded = await out.embedPages(src.getPages());

  for (let i = 0; i < count; i++) {
    const emb = embedded[i];
    const page = out.addPage([tw, th]);
    let dw: number, dh: number, x: number, y: number;
    if (fit === "stretch") {
      dw = tw;
      dh = th;
      x = 0;
      y = 0;
    } else {
      const scale = Math.min(tw / emb.width, th / emb.height);
      dw = emb.width * scale;
      dh = emb.height * scale;
      x = (tw - dw) / 2;
      y = (th - dh) / 2;
    }
    page.drawPage(emb, { x, y, width: dw, height: dh });
  }

  return out.save();
}
