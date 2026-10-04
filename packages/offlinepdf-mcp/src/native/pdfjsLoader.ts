// Shared, lazy pdfjs-dist loader for extractText.ts and ocr.ts.
//
// Root cause of a live bug found after the startup-hang fix (which was the first time
// extract_pdf_text actually ran inside the real Claude Desktop host): pdfjs-dist's Node
// detection, in pdf.mjs, is:
//
//   const isNodeJS = typeof process === "object" && process + "" === "[object process]"
//     && !process.versions.nw
//     && !(process.versions.electron && process.type && process.type !== "browser");
//
// Claude Desktop's "built-in Node.js" MCP host is an Electron `utilityProcess`
// (`process.type === "utility"`, with `process.versions.electron` set), so this
// deliberately excludes it — pdfjs-dist assumes anything Electron-but-not-main-process is a
// browser-like renderer, not Node. With isNodeJS false, pdfjs-dist skips the automatic
// "fake worker" (in-process, no real worker thread) setup it uses for genuine Node, and
// instead demands a `GlobalWorkerOptions.workerSrc` pointing at a real Worker script — which
// then also fails in plain Node, since there's no global `Worker` class to spawn it with.
//
// The fix is pdfjs-dist's own documented bundler escape hatch (the same pattern used in
// their official webpack example): import pdf.worker.mjs directly and assign its
// WorkerMessageHandler to `globalThis.pdfjsWorker`. pdfjs-dist checks for that global
// explicitly and uses it to run the worker in-process, bypassing the isNodeJS heuristic
// entirely instead of fighting it (which would be fragile against future pdfjs/Electron
// version changes).
let cached: typeof import("pdfjs-dist/legacy/build/pdf.mjs") | undefined;

export async function loadPdfjs() {
  if (cached) return cached;
  // pdfjs-dist ships no type declarations for the worker entry point (a plain runtime
  // asset, not part of its public API surface) — only its WorkerMessageHandler export
  // matters here, so the import specifier is cast past the missing declaration file.
  const [pdfjsLib, pdfjsWorker] = await Promise.all([
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("pdfjs-dist/legacy/build/pdf.worker.mjs" as any) as Promise<any>,
  ]);
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = pdfjsWorker;
  cached = pdfjsLib;
  return pdfjsLib;
}

// The same broken `isNodeJS` check also picks DOM-shaped defaults for several other
// independent switches inside getDocument(): a `document.createElement("canvas")`-based
// CanvasFactory, a `fetch()`-based BinaryDataFactory (crashes on the plain filesystem paths
// this package uses for standardFontDataUrl — fetch() can't read those), and
// OffscreenCanvas/ImageDecoder/@font-face support flags that don't exist in Node. All of
// these are forced below to exactly what pdfjs-dist's own (unexported) Node-path classes
// do — confirmed by reading pdfjs-dist's own NodeCanvasFactory/NodeBinaryDataFactory source
// — so behavior matches real Node regardless of the environment misdetection.

/** Mirrors pdfjs-dist's own (unexported) NodeBinaryDataFactory: a plain fs.readFile. */
class NodeBinaryDataFactory {
  private cMapUrl: string | null;
  private standardFontDataUrl: string | null;
  private wasmUrl: string | null;
  constructor({ cMapUrl = null, standardFontDataUrl = null, wasmUrl = null }: Record<string, string | null | undefined> = {}) {
    this.cMapUrl = cMapUrl ?? null;
    this.standardFontDataUrl = standardFontDataUrl ?? null;
    this.wasmUrl = wasmUrl ?? null;
  }
  async fetch({ kind, filename }: { kind: "cMapUrl" | "standardFontDataUrl" | "wasmUrl"; filename: string }) {
    const baseUrl = this[kind];
    if (!baseUrl) throw new Error(`Ensure that the \`${kind}\` API parameter is provided.`);
    const { readFile } = await import("node:fs/promises");
    return new Uint8Array(await readFile(`${baseUrl}${filename}`));
  }
}

/** Mirrors pdfjs-dist's own (unexported) NodeFilterFactory: a complete no-op, same as real Node. */
class NoopFilterFactory {
  addFilter() { return "none"; }
  addHCMFilter() { return "none"; }
  addAlphaFilter() { return "none"; }
  addLuminosityFilter() { return "none"; }
  addKnockoutFilter() { return "none"; }
  addHighlightHCMFilter() { return "none"; }
  addSelectionHCMFilter() { return "none"; }
  addSelectionFilter() { return "none"; }
  createSelectionStyle() { return null; }
  destroy() {}
}

/** getDocument() options shared by extractText.ts and ocr.ts to force Node-correct behavior. */
export function nodeSafePdfjsOptions<T extends Record<string, unknown>>(extra: T = {} as T) {
  return {
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    FilterFactory: NoopFilterFactory,
    BinaryDataFactory: NodeBinaryDataFactory,
    ...extra,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NapiCanvas = any;

/** Mirrors pdfjs-dist's own (unexported) NodeCanvasFactory, backed by @napi-rs/canvas. */
export function createNodeCanvasFactory(createCanvasFn: (w: number, h: number) => NapiCanvas) {
  return class NodeCanvasFactory {
    create(width: number, height: number) {
      if (width <= 0 || height <= 0) throw new Error("Invalid canvas size");
      const canvas = createCanvasFn(width, height);
      return { canvas, context: canvas.getContext("2d") };
    }
    reset(canvasAndContext: { canvas: NapiCanvas | null }, width: number, height: number) {
      if (!canvasAndContext.canvas) throw new Error("Canvas is not specified");
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext: { canvas: NapiCanvas | null; context: unknown }) {
      if (!canvasAndContext.canvas) throw new Error("Canvas is not specified");
      canvasAndContext.canvas.width = canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  };
}
