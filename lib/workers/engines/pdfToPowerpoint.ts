// Each PDF page becomes one full-bleed IMAGE slide. Not editable text — the UI says so.
import pptxgen from "pptxgenjs";
import { assertPageCount } from "@/lib/pdf/validate";
import { toBase64 } from "@/lib/pdf/unzipSafe";
import { openPdf, renderPage } from "./raster";

const MAX_SLIDES = 200; // every slide is a base64 JPEG held in memory

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void,
  warn?: (message: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const dpi = Math.min(Number(opts.dpi) || 110, 200);
  const pdf = await openPdf(files[0]);
  const total = pdf.numPages;
  assertPageCount(total);
  if (total > MAX_SLIDES) throw new Error(`This PDF has ${total} pages; PDF to PowerPoint supports up to ${MAX_SLIDES}. Split it first.`);

  const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
  const W = first.width / 72;
  const H = first.height / 72;
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "PDFPAGE", width: W, height: H });
  pptx.layout = "PDFPAGE";

  const failed: number[] = [];
  for (let i = 1; i <= total; i++) {
    onProgress(Math.round(((i - 1) / total) * 85), `Rendering page ${i}/${total}…`);
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const pw = vp.width / 72;
    const ph = vp.height / 72;
    const s = Math.min(W / pw, H / ph);
    let jpg: Uint8Array;
    try {
      const canvas = await renderPage(page, dpi / 72);
      jpg = new Uint8Array(await (await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 })).arrayBuffer());
    } catch {
      // pdf.js can throw on unusual embedded images (seen on Aadhaar PDFs). Keep the job alive: placeholder slide for this page only.
      failed.push(i);
      pptx.addSlide().addText(`Page ${i} could not be rendered and was left blank.`, { x: 0, y: 0, w: W, h: H, align: "center", valign: "middle", fontSize: 18, color: "666666" });
      continue;
    }
    pptx.addSlide().addImage({
      data: `image/jpeg;base64,${toBase64(jpg)}`,
      x: (W - pw * s) / 2,
      y: (H - ph * s) / 2,
      w: pw * s,
      h: ph * s,
    });
  }

  if (failed.length) warn?.(`${failed.length} of ${total} pages couldn't be converted and were left blank in the output (page${failed.length > 1 ? "s" : ""} ${failed.join(", ")}). You can still download the file; the rest is intact.`);
  onProgress(92, "Building PowerPoint…");
  const bytes = (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
  onProgress(100);
  return [{ name: "slides.pptx", bytes }];
}
