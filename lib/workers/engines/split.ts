import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertOutputSize, assertPageCount } from "@/lib/pdf/validate";
import { zipFiles } from "@/lib/pdf/zip";

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

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const src = await loadPdf(files[0]);
  const total = src.getPageCount();
  assertPageCount(total);
  const rangeStr = (opts.ranges as string | undefined) || "";
  // If ranges provided, split by them; otherwise one file per page
  const indices: number[][] = rangeStr
    ? [parseRanges(rangeStr, total)]
    : Array.from({ length: total }, (_, i) => [i]);
  if (indices.some((g) => g.length === 0)) throw new Error("No valid pages in that range.");

  const outputs: { name: string; bytes: Uint8Array }[] = [];
  let size = 0;
  for (let i = 0; i < indices.length; i++) {
    onProgress(Math.round((i / indices.length) * 90), `Creating part ${i + 1}…`);
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

  onProgress(95);
  if (outputs.length === 1) {
    onProgress(100);
    return outputs;
  }
  const zipBytes = await zipFiles(outputs);
  onProgress(100);
  return [{ name: "split.zip", bytes: zipBytes }];
}
