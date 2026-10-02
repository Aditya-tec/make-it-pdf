import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress(Math.round((i / files.length) * 90), `Merging file ${i + 1}/${files.length}…`);
    const doc = await loadPdf(files[i]);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  onProgress(95, "Saving…");
  const bytes = await merged.save();
  onProgress(100);
  return [{ name: "merged.pdf", bytes }];
}
