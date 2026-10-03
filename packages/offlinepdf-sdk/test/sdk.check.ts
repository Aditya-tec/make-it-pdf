/**
 * Self-contained correctness check for the SDK, independent of the website's e2e suite.
 * Run with: npm test (inside packages/offlinepdf-sdk) or npx tsx test/sdk.check.ts
 *
 * Creates minimal fixture PDFs in memory and asserts each function's real output
 * (page counts, rotation angles, file names) rather than just "did not throw".
 */
import assert from "node:assert/strict";
import { PDFDocument, PageSizes } from "pdf-lib";
import { unzipSync } from "fflate";
import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  organizePages,
  addWatermark,
  addPageNumbers,
  flattenPdf,
} from "../src/index";

async function makePdf(pages = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage(PageSizes.A4);
    page.drawText(`Test page ${i + 1}`, { x: 50, y: 700 });
  }
  return doc.save();
}

async function testMerge() {
  const a = await makePdf(2);
  const b = await makePdf(3);
  const out = await mergePdfs([a, b]);
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 5, "merge: should combine to 5 pages");
  console.log("✓ mergePdfs");
}

async function testMergeRejectsEmpty() {
  await assert.rejects(() => mergePdfs([]), /at least one file/i, "merge: empty input should throw");
  console.log("✓ mergePdfs rejects empty input");
}

async function testSplitAllPages() {
  const src = await makePdf(3);
  const outputs = await splitPdf(src);
  assert.equal(outputs.length, 1, "split: one-per-page result should be a single zip entry");
  assert.equal(outputs[0].name, "split.zip");
  const files = unzipSync(outputs[0].bytes);
  assert.equal(Object.keys(files).length, 3, "split: zip should contain 3 pages");
  console.log("✓ splitPdf (one file per page -> zip of 3)");
}

async function testSplitRange() {
  const src = await makePdf(5);
  const [out] = await splitPdf(src, { ranges: "2-3" });
  assert.equal(out.name, "split.pdf");
  const doc = await PDFDocument.load(out.bytes);
  assert.equal(doc.getPageCount(), 2, "split: range 2-3 should produce 2 pages");
  console.log("✓ splitPdf (range -> single pdf of 2)");
}

async function testRotate() {
  const src = await makePdf(1);
  const out = await rotatePdf(src, 90);
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPage(0).getRotation().angle, 90, "rotate: page should be rotated 90°");
  console.log("✓ rotatePdf");
}

async function testRotateRejectsBadAngle() {
  const src = await makePdf(1);
  // @ts-expect-error intentionally invalid at the type level, to check the runtime guard too
  await assert.rejects(() => rotatePdf(src, 45), /90, 180, or 270/, "rotate: invalid angle should throw");
  console.log("✓ rotatePdf rejects invalid angle");
}

async function testOrganize() {
  const src = await makePdf(3);
  // Keep page 1 as-is, drop page 2, keep page 3 rotated 90°.
  const out = await organizePages(src, [
    { originalIndex: 0, rotation: 0 },
    { originalIndex: 2, rotation: 90 },
  ]);
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 2, "organize: should keep 2 of 3 pages");
  assert.equal(doc.getPage(1).getRotation().angle, 90, "organize: second kept page should be rotated");
  console.log("✓ organizePages");
}

async function testOrganizeDropsUnlistedPages() {
  const src = await makePdf(5);
  // Only page 1 (index 0) is listed; pages 2-5 must be dropped, not passed through.
  const out = await organizePages(src, [{ originalIndex: 0, rotation: 0 }]);
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1, "organize: unlisted pages must be dropped, not kept");
  console.log("✓ organizePages drops pages not listed in ops");
}

async function testOrganizeRejectsEmpty() {
  const src = await makePdf(1);
  await assert.rejects(() => organizePages(src, []), /at least one page operation/i);
  console.log("✓ organizePages rejects empty ops");
}

async function testWatermark() {
  const src = await makePdf(1);
  const out = await addWatermark(src, { text: "DRAFT", opacity: 0.4, rotation: 30 });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1, "watermark: page count should be unchanged");
  console.log("✓ addWatermark");
}

async function testPageNumbers() {
  const src = await makePdf(3);
  const out = await addPageNumbers(src, { format: "n/N", skipFirst: true });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 3, "page numbers: page count should be unchanged");
  console.log("✓ addPageNumbers");
}

async function testFlatten() {
  const src = await makePdf(1);
  const out = await flattenPdf(src);
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 1, "flatten: page count should be unchanged");
  console.log("✓ flattenPdf");
}

async function main() {
  await testMerge();
  await testMergeRejectsEmpty();
  await testSplitAllPages();
  await testSplitRange();
  await testRotate();
  await testRotateRejectsBadAngle();
  await testOrganize();
  await testOrganizeDropsUnlistedPages();
  await testOrganizeRejectsEmpty();
  await testWatermark();
  await testPageNumbers();
  await testFlatten();
  console.log("\nAll offlinepdf-sdk checks passed.");
}

main().catch((err) => {
  console.error("\n✗ offlinepdf-sdk check failed:", err);
  process.exit(1);
});
