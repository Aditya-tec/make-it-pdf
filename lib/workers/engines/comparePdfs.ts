import { zipFiles } from "@/lib/pdf/zip";
import { assertPageCount } from "@/lib/pdf/validate";
import { paintDiff } from "@/lib/pdf/pixelDiff";
import { openPdf, renderPage } from "./raster";

// ponytail: holds every page PNG in memory, capped at 100. Stream pages if larger jobs matter.
const COMPARE_MAX = 100;
const WIDTH = 480;

async function shot(pdf: Awaited<ReturnType<typeof openPdf>>, index: number): Promise<OffscreenCanvas | null> {
  if (index > pdf.numPages) return null;
  const page = await pdf.getPage(index);
  const vp = page.getViewport({ scale: 1 });
  return renderPage(page, WIDTH / vp.width);
}

function pad(src: OffscreenCanvas | null, w: number, h: number): OffscreenCanvas {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  if (src) ctx.drawImage(src, 0, 0);
  return canvas;
}

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  if (files.length < 2) throw new Error("Choose two PDFs to compare.");
  const highlight = opts.highlight === true;
  onProgress(5, "Loading PDFs…");
  const a = await openPdf(files[0]);
  const b = await openPdf(files[1]);
  assertPageCount(a.numPages);
  assertPageCount(b.numPages);
  const total = Math.max(a.numPages, b.numPages);
  if (total > COMPARE_MAX) {
    throw new Error(`Comparison supports up to ${COMPARE_MAX} pages (this pair has ${total}). Split the longer PDF first.`);
  }
  const images: { name: string; bytes: Uint8Array }[] = [];
  for (let i = 1; i <= total; i++) {
    onProgress(Math.round((i / total) * 85), `Comparing page ${i}/${total}…`);
    const ca = await shot(a, i);
    const cb = await shot(b, i);
    const w = Math.max(ca?.width ?? WIDTH, cb?.width ?? WIDTH);
    const h = Math.max(ca?.height ?? 680, cb?.height ?? 680);
    const left = pad(ca, w, h);
    const right = pad(cb, w, h);
    if (highlight) {
      const lctx = left.getContext("2d")!;
      const rctx = right.getContext("2d")!;
      const la = lctx.getImageData(0, 0, w, h);
      const rb = rctx.getImageData(0, 0, w, h);
      paintDiff(la.data, rb.data, rb.data);
      rctx.putImageData(rb, 0, 0);
    }
    const n = String(i).padStart(4, "0");
    const la = new Uint8Array(await (await left.convertToBlob({ type: "image/png" })).arrayBuffer());
    const rb = new Uint8Array(await (await right.convertToBlob({ type: "image/png" })).arrayBuffer());
    images.push({ name: `${n}-a.png`, bytes: la }, { name: `${n}-b.png`, bytes: rb });
  }
  onProgress(95, "Packaging comparison…");
  const zipBytes = await zipFiles(images);
  onProgress(100);
  return [{ name: "comparison.zip", bytes: zipBytes }];
}
