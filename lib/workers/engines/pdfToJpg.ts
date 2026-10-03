// ponytail: pdf.js renders to OffscreenCanvas; DPI capped at 300 and pixels per page capped to avoid OOM.
import { assertOutputSize, assertPageCount } from "@/lib/pdf/validate";
import { zipFiles } from "@/lib/pdf/zip";
import { openPdf, renderPage } from "./raster";

export async function renderPdfImages(
  data: ArrayBuffer,
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const dpi = Math.min(Number(opts.dpi) || 150, 300);
  const fmt = (opts.format as string) === "png" ? "png" : "jpeg";
  const scale = dpi / 72;
  const quality = fmt === "jpeg" ? (Number(opts.quality) || 0.9) : 1;
  const pdf = await openPdf(data);
  const total = pdf.numPages;
  assertPageCount(total);
  const outputs: { name: string; bytes: Uint8Array }[] = [];
  let size = 0;
  for (let i = 1; i <= total; i++) {
    onProgress(Math.round(((i - 1) / total) * 90), `Rendering page ${i}/${total}…`);
    const canvas = await renderPage(await pdf.getPage(i), scale);
    const blob = await canvas.convertToBlob({ type: `image/${fmt}`, quality });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assertOutputSize((size += bytes.length));
    const ext = fmt === "jpeg" ? "jpg" : fmt;
    outputs.push({ name: `page_${String(i).padStart(4, "0")}.${ext}`, bytes });
  }
  return outputs;
}

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const outputs = await renderPdfImages(files[0], opts, onProgress);
  onProgress(95);
  if (outputs.length === 1) {
    onProgress(100);
    return outputs;
  }
  const zipBytes = await zipFiles(outputs);
  onProgress(100);
  return [{ name: "pages.zip", bytes: zipBytes }];
}
