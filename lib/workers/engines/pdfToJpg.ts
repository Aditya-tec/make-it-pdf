// ponytail: pdf.js renders to OffscreenCanvas; DPI capped at 300 and pixels per page capped to avoid OOM.
import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import { assertOutputSize, assertPageCount } from "@/lib/pdf/validate";
import { zipFiles } from "@/lib/pdf/zip";

const MAX_PIXELS = 40_000_000; // ~ A4 at 600 DPI; beyond this mobile browsers fail the canvas

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const dpi = Math.min(Number(opts.dpi) || 150, 300);
  const fmt = (opts.format as string) === "png" ? "png" : "jpeg";
  const scale = dpi / 72;
  const quality = fmt === "jpeg" ? (Number(opts.quality) || 0.9) : 1;

  const pdf = await pdfjsLib.getDocument({ data: files[0] }).promise;
  const total = pdf.numPages;
  assertPageCount(total);
  const outputs: { name: string; bytes: Uint8Array }[] = [];
  let size = 0;

  for (let i = 1; i <= total; i++) {
    onProgress(Math.round(((i - 1) / total) * 90), `Rendering page ${i}/${total}…`);
    const page = await pdf.getPage(i);
    let vp = page.getViewport({ scale });
    const px = vp.width * vp.height;
    if (px > MAX_PIXELS) vp = page.getViewport({ scale: scale * Math.sqrt(MAX_PIXELS / px) });
    const canvas = new OffscreenCanvas(Math.round(vp.width), Math.round(vp.height));
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;

    // pdfjs-dist 6.x: pass canvas:null to force canvasContext path for OffscreenCanvas
    await page.render({
      canvas: null,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport: vp,
    }).promise;

    const blob = await canvas.convertToBlob({ type: `image/${fmt}`, quality });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assertOutputSize((size += bytes.length));
    const ext = fmt === "jpeg" ? "jpg" : fmt;
    outputs.push({ name: `page_${String(i).padStart(4, "0")}.${ext}`, bytes });
  }

  onProgress(95);
  if (outputs.length === 1) {
    onProgress(100);
    return outputs;
  }
  const zipBytes = await zipFiles(outputs);
  onProgress(100);
  return [{ name: "pages.zip", bytes: zipBytes }];
}
