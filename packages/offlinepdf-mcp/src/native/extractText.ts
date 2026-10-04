// Node-native text extraction via pdfjs-dist. Confirmed in scoping: the default
// "pdfjs-dist" export throws `Promise.try is not a function` in plain Node — the
// package's own warning says to use the legacy build there instead.
//
// pdfjs-dist (35MB) is imported lazily, inside the function, not at module top level.
// This module is statically imported by index.ts at server startup (via tools/extractText.ts),
// so a top-level import here would load pdfjs-dist on every server start, whether or not
// extract_pdf_text is ever called — a real cost (~0.6s in plain Node) that's pure waste for
// the other 16 tools, and a risk in sandboxed host environments (e.g. Claude Desktop's
// Electron UtilityProcess) where loading extra modules during the startup handshake window
// is exactly what must be minimized.
import { assetPath } from "../assetsPath.js";
import { loadPdfjs, nodeSafePdfjsOptions } from "./pdfjsLoader.js";

export const SCANNED_PDF_MESSAGE =
  "No text found. This looks like a scanned (image-only) PDF. Use the ocr_pdf tool to make it searchable, then extract text.";

export interface PageText {
  page: number;
  text: string;
}

export async function extractPageTexts(bytes: Uint8Array): Promise<PageText[]> {
  console.error("[offlinepdf-mcp] extract_pdf_text: lazy-loading pdfjs-dist...");
  const pdfjsLib = await loadPdfjs();
  console.error("[offlinepdf-mcp] extract_pdf_text: lazy-load complete");
  const loadingTask = pdfjsLib.getDocument(
    nodeSafePdfjsOptions({
      data: bytes,
      // Avoids a glyph-width warning (and incorrect spacing) for PDFs whose fonts
      // aren't fully embedded — confirmed necessary in scoping.
      standardFontDataUrl: assetPath("standard_fonts") + "/",
    })
  );
  const pdf = await loadingTask.promise;

  const pages: PageText[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push({ page: i, text });
    }
  } finally {
    await loadingTask.destroy();
  }
  return pages;
}

export async function extractText(bytes: Uint8Array): Promise<string> {
  const pages = await extractPageTexts(bytes);
  const hasText = pages.some((p) => p.text.length > 0);
  if (!hasText) throw new Error(SCANNED_PDF_MESSAGE);
  return pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");
}
