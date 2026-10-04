// Regression test for a live bug found after the startup-hang fix: pdfjs-dist's `isNodeJS`
// detection (in pdf.mjs) is a module-level constant computed from `process.type` /
// `process.versions.electron` the FIRST time the module loads in this process. Claude
// Desktop's "built-in Node.js" MCP host is an Electron `utilityProcess`
// (`process.type === "utility"`, `process.versions.electron` set), which pdfjs-dist's check
// explicitly treats as browser-like, not Node — picking DOM-based defaults (a
// `document.createElement("canvas")` factory, a `fetch()`-based binary data loader,
// `GlobalWorkerOptions.workerSrc` required for a real `Worker`) that crash outside a browser.
//
// This MUST run as its own process (own `tsx` invocation, see package.json's "test" script),
// not as a case inside mcp.check.ts: process.type/versions.electron have to be set before
// pdfjs-dist is imported for the first time anywhere in the process, since `isNodeJS` is
// computed once and cached for the module's lifetime. Running this after mcp.check.ts's own
// extract_pdf_text/ocr_pdf tests (which load the real, unsimulated pdfjs-dist) would just
// silently pass without exercising anything.
Object.defineProperty(process, "type", { value: "utility", configurable: true });
process.versions.electron = "30.0.0";

import assert from "node:assert/strict";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createCanvas } from "@napi-rs/canvas";
import { extractText } from "../src/native/extractText.js";
import { ocrPdf } from "../src/native/ocr.js";

async function testExtractTextUnderSimulatedElectronHost() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 150]);
  page.drawText("Electron host regression test 123", { x: 20, y: 80, size: 18, font, color: rgb(0, 0, 0) });
  const bytes = await doc.save();

  const text = await extractText(bytes);
  assert.match(text, /Electron host regression test 123/, "extract_pdf_text must work under a simulated Electron utilityProcess host");
  console.log("✓ extract_pdf_text works under a simulated Electron utilityProcess host (process.type=utility)");
}

async function testOcrUnderSimulatedElectronHost() {
  const canvas = createCanvas(300, 80);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 300, 80);
  ctx.fillStyle = "black";
  ctx.font = "40px Arial";
  ctx.fillText("Electron 77", 10, 55);

  const doc = await PDFDocument.create();
  const img = await doc.embedPng(canvas.toBuffer("image/png"));
  const page = doc.addPage([300, 80]);
  page.drawImage(img, { x: 0, y: 0, width: 300, height: 80 });
  const bytes = await doc.save();

  const pages = await ocrPdf(bytes);
  assert.equal(pages.length, 1);
  assert.match(pages[0].text, /Electron/i, "ocr_pdf must work under a simulated Electron utilityProcess host");
  console.log("✓ ocr_pdf works under a simulated Electron utilityProcess host (process.type=utility)");
}

async function main() {
  assert.equal((process as unknown as { type: string }).type, "utility", "test setup sanity check");
  await testExtractTextUnderSimulatedElectronHost();
  await testOcrUnderSimulatedElectronHost();
  console.log("\nAll Electron-host regression checks passed.");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
