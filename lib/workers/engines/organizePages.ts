import { PDFDocument, degrees } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

/** PageOp: the ordered list of page operations sent from the UI. */
export type PageOp = {
  originalIndex: number; // 0-based index in the source PDF
  rotation: number;      // 0, 90, 180, 270
};

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const ops: PageOp[] = opts.pages as PageOp[];
  if (!ops || ops.length === 0) throw new Error("No page operations provided.");

  onProgress(10, "Loading document…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());
  const out = await PDFDocument.create();

  onProgress(30, "Rebuilding pages…");
  const copied = await out.copyPages(src, ops.map((o) => o.originalIndex));
  for (let i = 0; i < copied.length; i++) {
    const page = copied[i];
    const existing = page.getRotation().angle;
    page.setRotation(degrees((existing + ops[i].rotation) % 360));
    out.addPage(page);
    onProgress(30 + Math.round((i / ops.length) * 60));
  }

  onProgress(95, "Saving…");
  const bytes = await out.save();
  onProgress(100);
  return [{ name: "organized.pdf", bytes }];
}
