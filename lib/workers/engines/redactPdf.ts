// True redaction: rasterize each redacted page, paint black boxes, replace the page with that image.
// Text under boxes cannot be selected/extracted afterward. Non-redacted pages are copied as-is.
import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

export type RedactRect = { x: number; y: number; w: number; h: number }; // fractions of page, top-left origin
export type RedactPage = { pageIndex: number; rects: RedactRect[] };

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const redacted = (opts.pages as RedactPage[]) || [];
  const byPage = new Map(
    redacted.map((p) => [p.pageIndex, p.rects.filter((r) => r.w > 0 && r.h > 0)])
  );
  if (![...byPage.values()].some((r) => r.length)) {
    throw new Error("Draw at least one redaction box first.");
  }

  onProgress(5, "Loading…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());
  const pdfjs = await pdfjsLib.getDocument({ data: files[0].slice(0) }).promise;
  const out = await PDFDocument.create();
  const total = src.getPageCount();
  const scale = 2;

  for (let i = 0; i < total; i++) {
    onProgress(5 + Math.round((i / total) * 90), `Page ${i + 1}/${total}…`);
    const rects = byPage.get(i);
    if (!rects || rects.length === 0) {
      const [copied] = await out.copyPages(src, [i]);
      out.addPage(copied);
      continue;
    }
    const page = await pdfjs.getPage(i + 1);
    const vp = page.getViewport({ scale });
    const canvas = new OffscreenCanvas(Math.round(vp.width), Math.round(vp.height));
    const ctx = canvas.getContext("2d")!;
    await page.render({
      canvas: null,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport: vp,
    }).promise;
    ctx.fillStyle = "#000";
    for (const r of rects) {
      ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.w * canvas.width, r.h * canvas.height);
    }
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const img = await out.embedJpg(bytes);
    const { width, height } = src.getPage(i).getSize();
    const np = out.addPage([width, height]);
    np.drawImage(img, { x: 0, y: 0, width, height });
  }

  onProgress(98, "Saving…");
  const bytes = await out.save();
  onProgress(100);
  return [{ name: "redacted.pdf", bytes }];
}
