// Visual invert / grayscale / sepia via canvas. Pages become images — text is NOT selectable afterward.
// Labeled honestly in the UI. True content-stream recolor isn't feasible with pdf-lib alone.
import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { assertPageCount } from "@/lib/pdf/validate";

type Mode = "invert" | "grayscale" | "sepia";

function filterPixels(data: Uint8ClampedArray, mode: Mode) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    if (mode === "invert") {
      r = 255 - r; g = 255 - g; b = 255 - b;
    } else if (mode === "grayscale") {
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = y;
    } else {
      const nr = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      const ng = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      const nb = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
      r = nr; g = ng; b = nb;
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const mode = (opts.mode as Mode) || "invert";
  onProgress(5, "Loading…");
  const pdf = await pdfjsLib.getDocument({ data: files[0] }).promise;
  assertPageCount(pdf.numPages);
  const out = await PDFDocument.create();
  const scale = 1.5;

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(5 + Math.round(((i - 1) / pdf.numPages) * 90), `Rendering page ${i}…`);
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale });
    const canvas = new OffscreenCanvas(Math.round(vp.width), Math.round(vp.height));
    const ctx = canvas.getContext("2d")!;
    await page.render({
      canvas: null,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport: vp,
    }).promise;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    filterPixels(img.data, mode);
    ctx.putImageData(img, 0, 0);
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const jpg = await out.embedJpg(bytes);
    // PDF points ≈ CSS px at 72dpi; scale factor applied above
    const w = vp.width * (72 / (72 * scale));
    const h = vp.height * (72 / (72 * scale));
    const np = out.addPage([vp.width / scale, vp.height / scale]);
    np.drawImage(jpg, { x: 0, y: 0, width: np.getWidth(), height: np.getHeight() });
    void w; void h;
  }

  onProgress(98, "Saving…");
  const bytes = await out.save();
  onProgress(100);
  return [{ name: `${mode}.pdf`, bytes }];
}
