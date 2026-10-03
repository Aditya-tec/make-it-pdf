import { PDFDocument, degrees } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

export interface PageOp {
  /** 0-based index of the page in the source PDF. */
  originalIndex: number;
  /** Additional rotation to apply on top of the page's existing rotation: 0, 90, 180, or 270. */
  rotation: number;
}

/**
 * Reorder, rotate, and drop pages in one pass. `ops` is an explicit allowlist: it
 * lists every page you want in the output, in the order they should appear.
 *
 * This is deletion-by-omission, not a partial patch — any original page whose index
 * does not appear in `ops` is removed. To reorder or rotate without deleting anything,
 * every original page index must appear exactly once in `ops`.
 *
 * @example
 * // Keep page 1 as-is, then page 3 rotated 90°; page 2 and any other page is dropped.
 * const out = await organizePages(file, [
 *   { originalIndex: 0, rotation: 0 },
 *   { originalIndex: 2, rotation: 90 },
 * ]);
 *
 * @example
 * // Rotate every page without dropping any: list all of them.
 * const total = (await PDFDocument.load(file)).getPageCount();
 * const out = await organizePages(file, Array.from({ length: total }, (_, i) => ({
 *   originalIndex: i,
 *   rotation: 90,
 * })));
 */
export async function organizePages(file: Uint8Array, ops: PageOp[]): Promise<Uint8Array> {
  if (!ops || ops.length === 0) throw new Error("organizePages requires at least one page operation.");

  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());
  const out = await PDFDocument.create();

  const copied = await out.copyPages(src, ops.map((o) => o.originalIndex));
  copied.forEach((page, i) => {
    const existing = page.getRotation().angle;
    page.setRotation(degrees((existing + ops[i].rotation) % 360));
    out.addPage(page);
  });

  return out.save();
}
