"use client";
// Renders PDF pages to thumbnail data URLs in the main thread using pdf.js.
import type { PDFDocumentProxy } from "pdfjs-dist";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();
  }
  return pdfjsLib;
}

export async function loadPdfForPreview(bytes: ArrayBuffer): Promise<PDFDocumentProxy> {
  const lib = await getPdfjs();
  const task = lib.getDocument({ data: bytes.slice(0) });
  return task.promise;
}

export async function renderThumbnail(
  pdf: PDFDocumentProxy,
  pageIndex: number, // 0-based
  thumbWidth = 130
): Promise<string> {
  const page = await pdf.getPage(pageIndex + 1); // pdf.js is 1-indexed
  const vp = page.getViewport({ scale: 1 });
  const scale = thumbWidth / vp.width;
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(scaled.width);
  canvas.height = Math.round(scaled.height);
  const ctx = canvas.getContext("2d")!;

  // pdfjs-dist 6.x: canvas is the primary param; canvasContext for compat
  await page.render({ canvas, viewport: scaled }).promise;
  return canvas.toDataURL("image/jpeg", 0.7);
}
