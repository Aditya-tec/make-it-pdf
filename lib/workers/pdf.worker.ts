/// <reference lib="webworker" />
import { friendlyError } from "@/lib/pdf/validate";

// ponytail: single worker entry that lazy-imports the right engine per tool.
// If tool count grows past 40, consider one worker per tool family instead.

export type WorkerRequest = {
  tool: string;
  files: ArrayBuffer[];
  options: Record<string, unknown>;
};

export type WorkerResponse =
  | { type: "progress"; percent: number; message?: string }
  | { type: "done"; files: { name: string; bytes: Uint8Array }[] }
  | { type: "error"; message: string };

const ENGINE_MAP: Record<string, () => Promise<{ run: EngineRun }>> = {
  "merge-pdf": () => import("./engines/merge"),
  "split-pdf": () => import("./engines/split"),
  "compress-pdf": () => import("./engines/compress"),
  "pdf-to-jpg": () => import("./engines/pdfToJpg"),
  "images-to-pdf": () => import("./engines/imagesToPdf"),
  "word-to-pdf": () => import("./engines/wordToPdf"),
  "organize-pages": () => import("./engines/organizePages"),
  "add-watermark": () => import("./engines/addWatermark"),
  "encrypt-pdf": () => import("./engines/encryptPdf"),
  "extract-text": () => import("./engines/extractText"),
  "rotate-pdf": () => import("./engines/rotatePdf"),
  "crop-resize": () => import("./engines/cropResize"),
  "page-numbers": () => import("./engines/pageNumbers"),
  "headers-footers": () => import("./engines/headersFooters"),
  "remove-password": () => import("./engines/removePassword"),
  "ocr-pdf": () => import("./engines/ocrPdf"),
  "flatten-pdf": () => import("./engines/flattenPdf"),
  "redact-pdf": () => import("./engines/redactPdf"),
  "invert-colors": () => import("./engines/invertColors"),
  "privacy-scanner": () => import("./engines/privacyScanner"),
  "pdf-to-zip": () => import("./engines/pdfToZip"),
  "markdown-to-pdf": () => import("./engines/markdownToPdf"),
  "html-to-pdf": () => import("./engines/htmlToPdf"),
  "csv-to-pdf": () => import("./engines/csvToPdf"),
  "excel-to-pdf": () => import("./engines/excelToPdf"),
  "compare-pdfs": () => import("./engines/comparePdfs"),
  "repair-pdf": () => import("./engines/repairPdf"),
  "pdf-to-word": () => import("./engines/pdfToWord"),
  "create-pdf": () => import("./engines/htmlToPdf"),
  "pdf-to-epub": () => import("./engines/pdfToEpub"),
  "powerpoint-to-pdf": () => import("./engines/pptxToPdf"),
  "pdf-to-powerpoint": () => import("./engines/pdfToPowerpoint"),
  "pdf-to-excel": () => import("./engines/pdfToExcel"),
  "pdf-to-html": () => import("./engines/pdfToHtml"),
  "ebook-to-pdf": () => import("./engines/epubToPdf"),
  "fingerprint-pdf": () => import("./engines/fingerprintPdf"),
  "pos-billing": () => import("./engines/posBilling"),
  "scan-to-pdf": () => import("./engines/imagesToPdf"),
  "edit-pdf-text": () => import("./engines/editPdfText"),
  "pdf-to-audio": () => import("./engines/extractText"),
};

type ProgressCb = (percent: number, message?: string) => void;
type EngineRun = (
  files: ArrayBuffer[],
  options: Record<string, unknown>,
  onProgress: ProgressCb
) => Promise<{ name: string; bytes: Uint8Array }[]>;

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { tool, files, options } = e.data;
  const post = (msg: WorkerResponse) => self.postMessage(msg);

  const loader = ENGINE_MAP[tool];
  if (!loader) {
    post({ type: "error", message: `Unknown tool: ${tool}` });
    return;
  }

  try {
    const { run } = await loader();
    const result = await run(files, options, (percent, message) => {
      post({ type: "progress", percent, message });
    });
    // Transfer ownership of underlying ArrayBuffers to avoid copying
    const transferList = result.map((f) => f.bytes.buffer as ArrayBuffer);
    (self as unknown as Worker).postMessage({ type: "done", files: result }, transferList);
  } catch (err) {
    // Uncaught OOM often bypasses this; when it does land here, friendlyError maps it.
    post({ type: "error", message: friendlyError(err) });
  }
};
