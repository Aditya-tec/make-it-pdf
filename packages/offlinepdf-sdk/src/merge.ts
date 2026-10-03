import { PDFDocument } from "pdf-lib";
import { loadPdf } from "./internal/load";

/**
 * Merge multiple PDFs into one, in the given order.
 *
 * @example
 * const merged = await mergePdfs([fileA, fileB]);
 * fs.writeFileSync("merged.pdf", merged);
 */
export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  if (files.length === 0) throw new Error("mergePdfs requires at least one file.");
  const merged = await PDFDocument.create();
  for (const file of files) {
    const doc = await loadPdf(file);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}
