import { PDFDocument } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertOutputSize, assertPageCount } from "./internal/validate";
import { zipFiles } from "./internal/zip";

export interface SplitOptions {
  /** Page ranges like "1-3, 5, 7-10" (1-indexed). Omit to split into one file per page. */
  ranges?: string;
}

/** Parse a page-range string like "1-3, 5, 7-10" (1-indexed) into 0-indexed page indices. */
function parseRanges(rangeStr: string, total: number): number[] {
  const indices = new Set<number>();
  const parts = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      for (let i = Math.max(1, a); i <= Math.min(total, b); i++) indices.add(i - 1);
    } else {
      const n = Number(part);
      if (n >= 1 && n <= total) indices.add(n - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

/**
 * Split a PDF into individual pages, or into one PDF per range.
 *
 * Returns a single `{ name: "split.pdf", bytes }` when the result is one file,
 * or `{ name: "split.zip", bytes }` containing all the parts when there are several.
 *
 * @example
 * const [out] = await splitPdf(file, { ranges: "1-3, 5" });
 * // out.name === "split.pdf", out.bytes is pages 1-3 and 5
 *
 * const parts = await splitPdf(file); // one PDF per page, zipped
 */
export async function splitPdf(
  file: Uint8Array,
  options: SplitOptions = {}
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const src = await loadPdf(file);
  const total = src.getPageCount();
  assertPageCount(total);
  const rangeStr = options.ranges ?? "";
  const indices: number[][] = rangeStr
    ? [parseRanges(rangeStr, total)]
    : Array.from({ length: total }, (_, i) => [i]);
  if (indices.some((g) => g.length === 0)) throw new Error("No valid pages in that range.");

  const outputs: { name: string; bytes: Uint8Array }[] = [];
  let size = 0;
  for (let i = 0; i < indices.length; i++) {
    const part = await PDFDocument.create();
    const pages = await part.copyPages(src, indices[i]);
    pages.forEach((p) => part.addPage(p));
    const bytes = await part.save();
    // each part can re-embed shared resources, so total output can far exceed the input
    assertOutputSize((size += bytes.length));
    const name =
      indices.length === 1
        ? "split.pdf"
        : `page_${String(indices[i][0] + 1).padStart(4, "0")}.pdf`;
    outputs.push({ name, bytes });
  }

  if (outputs.length === 1) return outputs;
  const zipBytes = await zipFiles(outputs);
  return [{ name: "split.zip", bytes: zipBytes }];
}
