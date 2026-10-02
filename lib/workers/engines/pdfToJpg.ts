// ponytail: pdf.js renders to OffscreenCanvas; DPI capped at 300 to avoid OOM.
import * as pdfjsLib from "pdfjs-dist";
import { Zip, ZipPassThrough } from "fflate";

pdfjsLib.GlobalWorkerOptions.workerSrc = "";

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

function zipFiles(files: { name: string; bytes: Uint8Array }[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const zip = new Zip((err, chunk, final) => {
      if (err) return reject(err);
      chunks.push(chunk);
      if (final) resolve(concat(chunks));
    });
    for (const f of files) {
      const entry = new ZipPassThrough(f.name);
      zip.add(entry);
      entry.push(f.bytes, true);
    }
    zip.end();
  });
}

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const dpi = Math.min(Number(opts.dpi) || 150, 300);
  const fmt = (opts.format as string) || "jpeg";
  const scale = dpi / 72;
  const quality = fmt === "jpeg" ? (Number(opts.quality) || 0.9) : 1;

  const loadingTask = pdfjsLib.getDocument({ data: files[0] });
  const pdf = await loadingTask.promise;
  const total = pdf.numPages;
  const outputs: { name: string; bytes: Uint8Array }[] = [];

  for (let i = 1; i <= total; i++) {
    onProgress(Math.round(((i - 1) / total) * 90), `Rendering page ${i}/${total}…`);
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale });
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
