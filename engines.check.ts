/**
 * Self-contained engine smoke test.
 * Run with: npx tsx engines.check.ts
 *
 * Creates minimal fixture PDFs in memory and asserts
 * that each engine returns bytes without throwing.
 * No framework, no fixtures on disk.
 */
import assert from "node:assert/strict";
import { PDFDocument, PageSizes } from "pdf-lib";

// --- helpers ----------------------------------------------------------------

async function makePdf(pages = 1): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage(PageSizes.A4);
    page.drawText(`Test page ${i + 1}`, { x: 50, y: 700 });
  }
  const bytes = await doc.save();
  return bytes.buffer as ArrayBuffer;
}

const noop = () => {};

// --- engine tests -----------------------------------------------------------

async function testMerge() {
  const { run } = await import("./lib/workers/engines/merge.js");
  const a = await makePdf(2);
  const b = await makePdf(3);
  const result = await run([a, b], {}, noop);
  assert.equal(result.length, 1, "merge: should produce 1 output file");
  const out = await PDFDocument.load(result[0].bytes);
  assert.equal(out.getPageCount(), 5, "merge: merged page count should be 5");
  console.log("✓ merge-pdf");
}

async function testSplit() {
  const { run } = await import("./lib/workers/engines/split.js");
  const src = await makePdf(5);
  const result = await run([src], { ranges: "1,3" }, noop);
  // When ranges select individual pages, split returns a zip or single pdf
  assert(result.length >= 1, "split: should return at least one file");
  console.log("✓ split-pdf");
}

async function testMergeThenSplit() {
  // Integration: merge then split all pages
  const { run: merge } = await import("./lib/workers/engines/merge.js");
  const { run: split } = await import("./lib/workers/engines/split.js");
  const a = await makePdf(2);
  const b = await makePdf(2);
  const [merged] = await merge([a, b], {}, noop);
  const parts = await split([merged.bytes.buffer as ArrayBuffer], {}, noop);
  // zip or multiple — just assert no throw
  assert(parts.length >= 1);
  console.log("✓ merge→split integration");
}

async function testOrganize() {
  const { run } = await import("./lib/workers/engines/organizePages.js");
  const src = await makePdf(3);
  const ops = [
    { originalIndex: 2, rotation: 0 },
    { originalIndex: 0, rotation: 90 },
  ];
  const result = await run([src], { pages: ops }, noop);
  assert.equal(result.length, 1);
  const out = await PDFDocument.load(result[0].bytes);
  assert.equal(out.getPageCount(), 2, "organize: should keep only 2 pages");
  console.log("✓ organize-pages");
}

async function testWatermark() {
  const { run } = await import("./lib/workers/engines/addWatermark.js");
  const src = await makePdf(1);
  const result = await run([src], { text: "DRAFT", opacity: 0.3, rotation: 45, fontSize: 48 }, noop);
  assert.equal(result.length, 1);
  assert(result[0].bytes.length > 0, "watermark: output should not be empty");
  console.log("✓ add-watermark");
}

async function testImagesToPdf() {
  // Create a minimal 1x1 white PNG (88 bytes)
  const PNG_1x1 = new Uint8Array([
    0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
    0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41,0x54,0x08,0xd7,0x63,0xf8,0xff,0xff,0x3f,
    0x00,0x05,0xfe,0x02,0xfe,0xdc,0xcc,0x59,0xe7,0x00,0x00,0x00,0x00,0x49,0x45,0x4e,
    0x44,0xae,0x42,0x60,0x82,
  ]);
  const { run } = await import("./lib/workers/engines/imagesToPdf.js");
  const result = await run([PNG_1x1.buffer as ArrayBuffer], { pageSize: "fit" }, noop);
  assert.equal(result.length, 1);
  const doc = await PDFDocument.load(result[0].bytes);
  assert.equal(doc.getPageCount(), 1);
  console.log("✓ images-to-pdf");
}

// --- run all ----------------------------------------------------------------

(async () => {
  try {
    await testMerge();
    await testSplit();
    await testMergeThenSplit();
    await testOrganize();
    await testWatermark();
    await testImagesToPdf();
    console.log("\nAll engine checks passed ✓");
  } catch (err) {
    console.error("\nEngine check FAILED:", err);
    process.exit(1);
  }
})();
