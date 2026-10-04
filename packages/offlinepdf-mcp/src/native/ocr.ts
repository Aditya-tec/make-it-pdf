// Node-native OCR pipeline, confirmed empirically in scoping:
//   1. pdfjs-dist (legacy Node build) renders each page into a raster buffer via
//      @napi-rs/canvas (prebuilt native binaries, no system Cairo/Pango needed — unlike
//      node-canvas, a common source of broken installs).
//   2. tesseract.js OCRs that buffer, using its own real Node worker path.
//
// Two hard requirements from scoping, both enforced here:
//   - langPath points at the traineddata bundled in this package (src/assets/tess/lang),
//     never the jsdelivr CDN tesseract.js defaults to when langPath is unset.
//   - cachePath points at a dedicated OS temp subdirectory, never the caller's cwd.
//
// tesseract.js, @napi-rs/canvas (a native addon), and pdfjs-dist are all imported lazily,
// inside ocrPdf(), not at module top level. This module is statically imported by index.ts
// at server startup (via tools/ocr.ts), so top-level imports here would load all three on
// every server start, whether or not ocr_pdf is ever called. Loading a native addon eagerly
// is the bigger risk: in a sandboxed host process (e.g. Claude Desktop's Electron
// UtilityProcess), that's exactly the kind of extra work that should be deferred until the
// feature that actually needs it is invoked, well after the server has already connected.
import os from "node:os";
import path from "node:path";
import { assetPath } from "../assetsPath.js";
import { loadPdfjs, nodeSafePdfjsOptions, createNodeCanvasFactory } from "./pdfjsLoader.js";

const CACHE_DIR = path.join(os.tmpdir(), "offlinepdf-mcp-ocr-cache");

export interface OcrPageResult {
  page: number;
  text: string;
  confidence: number;
}

export interface OcrOptions {
  /** Only "eng" is bundled with this server. */
  lang?: string;
}

export async function ocrPdf(bytes: Uint8Array, options: OcrOptions = {}): Promise<OcrPageResult[]> {
  const lang = options.lang ?? "eng";
  if (lang !== "eng") {
    throw new Error(
      `Only English OCR ("eng") is bundled with this server. Got "${lang}". ` +
        "Adding other languages would require bundling their traineddata files too."
    );
  }

  console.error("[offlinepdf-mcp] ocr_pdf: lazy-loading pdfjs-dist, @napi-rs/canvas, tesseract.js...");
  const [pdfjsLib, { createCanvas }, { createWorker }] = await Promise.all([
    loadPdfjs(),
    import("@napi-rs/canvas"),
    import("tesseract.js"),
  ]);
  console.error("[offlinepdf-mcp] ocr_pdf: lazy-load complete");

  // pdfjs-dist's Node detection (`isNodeJS` in pdf.mjs) explicitly excludes Electron
  // processes unless `process.type === "browser"` — Claude Desktop's MCP host is an
  // Electron `utilityProcess` (`process.type === "utility"`), so pdfjs-dist wrongly treats
  // it as browser-like and picks DOM-based defaults (a `document.createElement("canvas")`
  // factory, a `fetch()`-based binary data loader, CSS @font-face loading,
  // OffscreenCanvas/ImageDecoder support) that don't exist in Node and crash. loadPdfjs()
  // already fixes worker setup the same way; nodeSafePdfjsOptions() plus an explicit
  // CanvasFactory fix the rest, forcing exactly what real Node would have picked
  // automatically, regardless of pdfjs-dist's environment check being wrong here.
  const loadingTask = pdfjsLib.getDocument(
    nodeSafePdfjsOptions({
      data: bytes,
      standardFontDataUrl: assetPath("standard_fonts") + "/",
      CanvasFactory: createNodeCanvasFactory(createCanvas),
    })
  );
  const pdf = await loadingTask.promise;

  const worker = await createWorker(lang, 1, {
    langPath: assetPath("tess", "lang"),
    cachePath: CACHE_DIR,
    gzip: true,
    logger: () => {},
  });

  const results: OcrPageResult[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.5 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const ctx = canvas.getContext("2d");
      // @napi-rs/canvas's context is API-compatible with the DOM CanvasRenderingContext2D
      // surface pdfjs-dist needs, confirmed empirically in scoping; cast past the type gap.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvas: canvas as any, canvasContext: ctx as any, viewport }).promise;
      const png = canvas.toBuffer("image/png");

      const { data } = await worker.recognize(png);
      results.push({ page: i, text: data.text.trim(), confidence: data.confidence });
    }
  } finally {
    await worker.terminate();
    await loadingTask.destroy();
  }
  return results;
}
