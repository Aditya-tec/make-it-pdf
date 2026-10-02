// OCR → searchable PDF. Tesseract assets are served from /tess/ (copied by copy-assets.mjs), never a CDN.
import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createWorker } from "tesseract.js";
import { assertPageCount, MAX_PAGES } from "@/lib/pdf/validate";

const OCR_PAGE_CAP = 75; // ponytail: OCR is heavy; 75 pages covers most scans. Raise with care.

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const lang = (opts.lang as string) || "eng";
  onProgress(2, "Loading PDF…");
  const pdf = await pdfjsLib.getDocument({ data: files[0] }).promise;
  if (pdf.numPages > OCR_PAGE_CAP) {
    throw new Error(`OCR supports up to ${OCR_PAGE_CAP} pages (this file has ${pdf.numPages}). Split the PDF first.`);
  }
  assertPageCount(Math.min(pdf.numPages, MAX_PAGES));

  onProgress(5, "Starting OCR engine…");
  const origin = self.location.origin;
  const worker = await createWorker(lang, 1, {
    workerPath: `${origin}/tess/worker.min.js`,
    corePath: `${origin}/tess`,
    langPath: `${origin}/tess/lang`,
    workerBlobURL: false,
    logger: () => {},
  });

  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const scale = 2;

  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress(5 + Math.round(((i - 1) / pdf.numPages) * 90), `OCR page ${i}/${pdf.numPages}…`);
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale });
      const canvas = new OffscreenCanvas(Math.round(vp.width), Math.round(vp.height));
      const ctx = canvas.getContext("2d")!;
      await page.render({
        canvas: null,
        canvasContext: ctx as unknown as CanvasRenderingContext2D,
        viewport: vp,
      }).promise;
      const blob = await canvas.convertToBlob({ type: "image/png" });
      const pngBytes = new Uint8Array(await blob.arrayBuffer());

      const { data } = await worker.recognize(blob);
      const pageW = vp.width / scale;
      const pageH = vp.height / scale;
      const np = out.addPage([pageW, pageH]);
      const img = await out.embedPng(pngBytes);
      np.drawImage(img, { x: 0, y: 0, width: pageW, height: pageH });

      const words: { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }[] = [];
      for (const block of data.blocks || []) {
        for (const para of block.paragraphs || []) {
          for (const line of para.lines || []) {
            for (const word of line.words || []) words.push(word);
          }
        }
      }
      for (const word of words) {
        const text = word.text?.trim();
        if (!text || !word.bbox) continue;
        const { x0, y0, x1, y1 } = word.bbox;
        const w = (x1 - x0) / scale;
        const h = Math.max(4, (y1 - y0) / scale);
        const x = x0 / scale;
        const y = pageH - y1 / scale;
        const size = Math.min(24, Math.max(4, h * 0.85));
        try {
          np.drawText(text, {
            x,
            y,
            size,
            font,
            color: rgb(0, 0, 0),
            opacity: 0,
            maxWidth: Math.max(w, 1),
          });
        } catch {
          // skip glyphs Helvetica can't encode
        }
      }
    }
  } finally {
    await worker.terminate();
  }

  onProgress(98, "Saving…");
  const bytes = await out.save();
  onProgress(100);
  return [{ name: "ocr-searchable.pdf", bytes }];
}
