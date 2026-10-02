// Side-effect import for engines that use pdf.js inside our Web Worker. pdf.js spawns its own nested
// worker from a bundled (same-origin) asset. Do NOT import pdf.worker.mjs directly into our worker:
// it auto-attaches to the global scope and hijacks our message channel.
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();
