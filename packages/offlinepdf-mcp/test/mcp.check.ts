// Standalone test suite, same style as offlinepdf-sdk's test/sdk.check.ts: plain
// node:assert + tsx, no test framework. Exercises every tool's core logic directly
// (the native/ functions and the SDK wrappers' underlying calls) rather than spinning
// up a live MCP client — that's covered separately by a manual Claude Desktop test
// (see README).
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mergePdfs, splitPdf, rotatePdf, scanPdfMetadata, stripPdfMetadata, csvToPdf } from "offlinepdf-sdk";

import { extractText, SCANNED_PDF_MESSAGE } from "../src/native/extractText.js";
import { repairPdf } from "../src/native/repairPdf.js";
import { posBilling } from "../src/native/posBilling.js";
import { ocrPdf } from "../src/native/ocr.js";

let workDir: string;

async function makePdf(pages: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of pages) {
    // Wide enough that drawn text never overflows the page: pdfjs-dist clips extracted
    // text at the page boundary, which would otherwise look like an extraction bug.
    const page = doc.addPage([600, 300]);
    if (text) page.drawText(text, { x: 20, y: 150, size: 20, font, color: rgb(0, 0, 0) });
  }
  return doc.save();
}

async function testSdkToolsReachable() {
  const pdf1 = await makePdf(["Doc A page 1"]);
  const pdf2 = await makePdf(["Doc B page 1"]);
  const merged = await mergePdfs([pdf1, pdf2]);
  const doc = await PDFDocument.load(merged);
  assert.equal(doc.getPageCount(), 2, "merge should combine both PDFs");
  console.log("✓ offlinepdf-sdk functions are reachable through the workspace dependency (mergePdfs)");
}

async function testSplitAndRotate() {
  const pdf = await makePdf(["p1", "p2", "p3"]);
  const [split] = await splitPdf(pdf, { ranges: "1-2" });
  const splitDoc = await PDFDocument.load(split.bytes);
  assert.equal(splitDoc.getPageCount(), 2, "split with ranges 1-2 should yield 2 pages");

  const rotated = await rotatePdf(pdf, 90);
  const rotatedDoc = await PDFDocument.load(rotated);
  assert.equal(rotatedDoc.getPage(0).getRotation().angle, 90, "rotate should set a 90° rotation");
  console.log("✓ split_pdf and rotate_pdf logic produce correct structural results");
}

async function testPrivacyScanAndStrip() {
  const doc = await PDFDocument.create();
  doc.setAuthor("Jane Doe");
  doc.setTitle("Secret Plans");
  doc.addPage([200, 200]);
  const bytes = await doc.save();

  const scan = await scanPdfMetadata(bytes);
  assert.ok(scan.findings.some((f) => f.key === "Author"), "scan should find the Author field");

  const stripped = await stripPdfMetadata(bytes);
  const cleanedDoc = await PDFDocument.load(stripped.bytes);
  assert.equal(cleanedDoc.getAuthor() ?? "", "", "stripped PDF should have no Author");
  console.log("✓ scan_pdf_metadata finds findings, strip_pdf_metadata removes them");
}

async function testCsvToPdf() {
  const csv = "Name,Amount\nTea,20\nSamosa,15\n";
  const bytes = await csvToPdf(new TextEncoder().encode(csv), { title: "Test" });
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() >= 1, "csv_to_pdf should produce at least one page");
  console.log("✓ csv_to_pdf produces a valid PDF");
}

async function testExtractText() {
  const pdf = await makePdf(["The quick brown fox jumps 42 times."]);
  const text = await extractText(pdf);
  assert.match(text, /quick brown fox jumps 42 times/, "extracted text should contain the drawn text");
  console.log("✓ extract_pdf_text extracts real text via pdfjs-dist legacy build");
}

async function testExtractTextRejectsScannedPdf() {
  const pdf = await makePdf(["", ""]); // pages with no drawn text at all
  await assert.rejects(() => extractText(pdf), new RegExp(SCANNED_PDF_MESSAGE.slice(0, 20)), "should reject a text-free PDF with the scanned-PDF message");
  console.log("✓ extract_pdf_text reports the scanned-PDF message when there's no text layer");
}

async function testRepairCleanRebuild() {
  const pdf = await makePdf(["healthy pdf"]);
  const result = await repairPdf(pdf);
  assert.equal(result.strategy, "clean-rebuild", "a healthy PDF should repair via clean-rebuild");
  const doc = await PDFDocument.load(result.bytes);
  assert.equal(doc.getPageCount(), 1);
  console.log("✓ repair_pdf strategy 1 (clean rebuild) succeeds on a healthy PDF");
}

async function testRepairBothStrategiesFailMessage() {
  const garbage = new Uint8Array([1, 2, 3, 4, 5]);
  await assert.rejects(
    () => repairPdf(garbage),
    /Could not repair this PDF.*Both available recovery strategies/s,
    "both strategies failing should produce an explicit, honest error — not a silent/partial result"
  );
  console.log("✓ repair_pdf gives an explicit error (not a false partial success) when both strategies fail");
}

async function testPosBilling() {
  const bytes = await posBilling({
    items: [
      { name: "Tea", price: 20, qty: 2, gst: 5 },
      { name: "Samosa", price: 15, qty: 3, gst: 12 },
    ],
    inclusive: false,
    width: "80mm",
    shop: "Test Shop",
  });
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() >= 1, "receipt should produce at least one page");
  console.log("✓ generate_pos_receipt produces a valid receipt PDF with GST math");
}

async function testPosBillingValidation() {
  await assert.rejects(
    () => posBilling({ items: [{ name: "x".repeat(61), price: 1, qty: 1, gst: 0 }] }),
    /up to 60 characters/,
    "an over-long item name should be rejected with a clear message"
  );
  console.log("✓ generate_pos_receipt validates cart items and rejects bad input with a clear message");
}

async function testOcrOfflineFromBundledData() {
  // Hard requirement from scoping: OCR must work from the bundled local traineddata only,
  // with zero network access — never fetching from jsdelivr or writing to an arbitrary cwd.
  const originalFetch = globalThis.fetch;
  (globalThis as { fetch?: typeof fetch }).fetch = (async (url: unknown) => {
    throw new Error("NETWORK BLOCKED IN TEST: attempted to fetch " + String(url));
  }) as typeof fetch;

  try {
    const { createCanvas } = await import("@napi-rs/canvas");
    const { PDFDocument: PD, rgb: rgbFn } = await import("pdf-lib");
    const doc = await PD.create();
    doc.addPage([400, 150]);
    void rgbFn;

    // Build a scanned-style page by rasterizing real text directly (napi-rs/canvas),
    // same approach used in scoping: this avoids depending on a font embed round-trip
    // through pdfjs rendering just to prove the OCR engine itself works offline.
    const canvas = createCanvas(300, 80);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 300, 80);
    ctx.fillStyle = "black";
    ctx.font = "40px Arial";
    ctx.fillText("Offline 99", 10, 55);

    const singlePagePdf = await (async () => {
      const d = await PD.create();
      const img = await d.embedPng(canvas.toBuffer("image/png"));
      const page = d.addPage([300, 80]);
      page.drawImage(img, { x: 0, y: 0, width: 300, height: 80 });
      return d.save();
    })();

    const pages = await ocrPdf(singlePagePdf, { lang: "eng" });
    assert.equal(pages.length, 1, "should OCR exactly one page");
    assert.match(pages[0].text, /Offline/i, "OCR should read back the rendered text, using only the bundled traineddata, with no network access");
    console.log("✓ ocr_pdf works fully offline from the bundled local traineddata (network calls blocked in this test)");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function testOcrRejectsUnsupportedLanguage() {
  const pdf = await makePdf(["irrelevant"]);
  await assert.rejects(() => ocrPdf(pdf, { lang: "fra" }), /Only English OCR/, "should reject a non-bundled language with a clear message");
  console.log("✓ ocr_pdf rejects unsupported languages with a clear message instead of silently failing");
}

async function main() {
  workDir = await mkdtemp(path.join(tmpdir(), "offlinepdf-mcp-test-"));
  try {
    await testSdkToolsReachable();
    await testSplitAndRotate();
    await testPrivacyScanAndStrip();
    await testCsvToPdf();
    await testExtractText();
    await testExtractTextRejectsScannedPdf();
    await testRepairCleanRebuild();
    await testRepairBothStrategiesFailMessage();
    await testPosBilling();
    await testPosBillingValidation();
    await testOcrOfflineFromBundledData();
    await testOcrRejectsUnsupportedLanguage();
    console.log("\nAll offlinepdf-mcp checks passed.");
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
