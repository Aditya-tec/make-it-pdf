// Shared pdf.js → OffscreenCanvas path (PDF to JPG, PDF to ZIP, Compare).
import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";

const MAX_PIXELS = 40_000_000;

export async function openPdf(data: ArrayBuffer) {
  return pdfjsLib.getDocument({ data }).promise;
}

export async function renderPage(page: PDFPageProxy, scale: number): Promise<OffscreenCanvas> {
  let vp = page.getViewport({ scale });
  const px = vp.width * vp.height;
  if (px > MAX_PIXELS) vp = page.getViewport({ scale: scale * Math.sqrt(MAX_PIXELS / px) });
  const canvas = new OffscreenCanvas(Math.max(1, Math.round(vp.width)), Math.max(1, Math.round(vp.height)));
  const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({
    canvas: null,
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport: vp,
  }).promise;
  return canvas;
}
