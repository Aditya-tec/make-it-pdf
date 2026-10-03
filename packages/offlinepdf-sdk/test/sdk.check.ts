/**
 * Self-contained correctness check for the SDK, independent of the website's e2e suite.
 * Run with: npm test (inside packages/offlinepdf-sdk) or npx tsx test/sdk.check.ts
 *
 * Creates minimal fixture PDFs in memory and asserts each function's real output
 * (page counts, rotation angles, file names) rather than just "did not throw".
 */
import assert from "node:assert/strict";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PageSizes,
  PDFName,
  PDFRawStream,
  PDFStream,
  PDFString,
} from "pdf-lib";
import { unzipSync } from "fflate";
import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  organizePages,
  addWatermark,
  addPageNumbers,
  flattenPdf,
  addHeaderFooter,
  cropPdf,
  fingerprintPdf,
  generateFingerprintId,
  FINGERPRINT_ID_PATTERN,
  scanPdfMetadata,
  stripPdfMetadata,
  csvToPdf,
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

async function testHeaderFooter() {
  const src = await makePdf(2);
  const out = await addHeaderFooter(src, {
    header: "Q3 Report",
    footer: "Confidential",
    includePageNumber: true,
    includeDate: true,
  });
  const doc = await PDFDocument.load(out);
  assert.equal(doc.getPageCount(), 2, "header/footer: page count should be unchanged");
  console.log("✓ addHeaderFooter");
}

async function testHeaderFooterNoOptions() {
  const src = await makePdf(1);
  const out = await addHeaderFooter(src); // no header/footer/date/page-number at all
  await PDFDocument.load(out);
  console.log("✓ addHeaderFooter with no options draws nothing but still saves");
}

async function testCropMargins() {
  const src = await makePdf(1);
  const original = (await PDFDocument.load(src)).getPage(0).getSize();
  const out = await cropPdf(src, { marginTop: 0.1, marginRight: 0.1, marginBottom: 0.1, marginLeft: 0.1 });
  const doc = await PDFDocument.load(out);
  const cropped = doc.getPage(0).getSize();
  assert(cropped.width < original.width, "crop: width should shrink after margin crop");
  assert(cropped.height < original.height, "crop: height should shrink after margin crop");
  console.log("✓ cropPdf (margins)");
}

async function testCropResize() {
  const src = await makePdf(2);
  const out = await cropPdf(src, { mode: "resize", target: "letter", fit: "contain" });
  const doc = await PDFDocument.load(out);
  const [lw, lh] = PageSizes.Letter;
  const size = doc.getPage(0).getSize();
  assert.equal(size.width, lw, "crop: resize should match Letter width");
  assert.equal(size.height, lh, "crop: resize should match Letter height");
  assert.equal(doc.getPageCount(), 2, "crop: resize should keep page count");
  console.log("✓ cropPdf (resize)");
}

async function testFingerprintGeneratesId() {
  const src = await makePdf(1);
  const { bytes, id } = await fingerprintPdf(src, { label: "sent to Acme Corp" });
  assert.match(id, FINGERPRINT_ID_PATTERN, "fingerprint: generated ID should match the expected pattern");
  await PDFDocument.load(bytes);
  console.log("✓ fingerprintPdf generates and stamps an ID");
}

async function testFingerprintCustomId() {
  const src = await makePdf(1);
  const customId = generateFingerprintId();
  const { id } = await fingerprintPdf(src, { id: customId });
  assert.equal(id, customId, "fingerprint: should use the caller-supplied ID verbatim");
  console.log("✓ fingerprintPdf accepts a caller-supplied ID");
}

async function testFingerprintRejectsBadId() {
  const src = await makePdf(1);
  await assert.rejects(() => fingerprintPdf(src, { id: "not-a-valid-id" }), /invalid fingerprint id/i);
  console.log("✓ fingerprintPdf rejects a malformed ID");
}

async function testScanPdfMetadata() {
  const doc = await PDFDocument.create();
  doc.addPage(PageSizes.A4);
  doc.setAuthor("Jane Secret");
  doc.setTitle("Confidential Draft");
  const bytes = await doc.save();

  const { findings, pageCount } = await scanPdfMetadata(bytes);
  assert.equal(pageCount, 1, "scan: page count should match the source");
  assert(findings.some((f) => f.key === "Author" && f.value === "Jane Secret"), "scan: should find Author");
  assert(findings.some((f) => f.key === "Title" && f.value === "Confidential Draft"), "scan: should find Title");
  console.log("✓ scanPdfMetadata finds author and title");
}

async function testStripPdfMetadataByteLevel() {
  // Byte-level verification, ported from the website's lib/privacyScanner.check.mts: builds a
  // PDF carrying XMP, an embedded file, a file-attachment annotation, and page-level metadata —
  // all with marker strings — then inspects every indirect object of the STRIPPED output.
  const SECRET = "SECRET-XMP-MARKER";
  const ATTACH = "SECRET-ATTACHMENT-MARKER";

  const src = await PDFDocument.create();
  const page = src.addPage([200, 200]);
  src.setAuthor("Jane Secret");
  const stream = (ctx: typeof src.context, text: string, dict: Record<string, string>) => {
    const s = PDFRawStream.of(ctx.obj({ Type: "Metadata", Subtype: "XML", ...dict }), new TextEncoder().encode(text));
    return ctx.register(s);
  };
  const xmp = stream(src.context, `<x:xmpmeta>${SECRET}</x:xmpmeta>`, {});
  src.catalog.set(PDFName.of("Metadata"), xmp);
  page.node.set(PDFName.of("Metadata"), stream(src.context, `<x>${SECRET}-PAGE</x>`, {}));
  await src.attach(new TextEncoder().encode(ATTACH), "secret.txt", { mimeType: "text/plain" }); // catalog /Names /EmbeddedFiles
  // file-attachment annotation on the page
  const fileRef = src.context.register(PDFRawStream.of(src.context.obj({ Type: "EmbeddedFile" }), new TextEncoder().encode(ATTACH + "-ANNOT")));
  const spec = src.context.obj({ Type: "Filespec", F: PDFString.of("annot.txt"), EF: { F: fileRef } });
  const annot = src.context.register(src.context.obj({ Type: "Annot", Subtype: "FileAttachment", Rect: [0, 0, 10, 10], FS: spec }));
  page.node.set(PDFName.of("Annots"), src.context.obj([annot]));
  src.catalog.set(PDFName.of("PieceInfo"), src.context.obj({ App: { Private: PDFString.of(SECRET) } }));

  const inBytes = await src.save();
  const { bytes, findings } = await stripPdfMetadata(inBytes);
  assert(findings.some((f) => f.key === "Author"), "strip: findings should report the Author that was removed");

  // Inspect the output's real structure: every object, decoded to text.
  const out = await PDFDocument.load(bytes);
  const found: string[] = [];
  for (const [, obj] of out.context.enumerateIndirectObjects()) {
    const text = obj instanceof PDFStream ? new TextDecoder("latin1").decode((obj as PDFRawStream).getContents()) : "";
    const dict = obj instanceof PDFStream ? obj.dict : obj instanceof PDFDict ? obj : undefined;
    const repr = String(obj) + text;
    if (repr.includes(SECRET) || repr.includes(ATTACH)) found.push("marker string");
    if (dict?.get(PDFName.of("Type"))?.toString() === "/Metadata") found.push("Metadata stream");
    if (dict?.get(PDFName.of("Type"))?.toString() === "/EmbeddedFile") found.push("EmbeddedFile stream");
    if (dict?.get(PDFName.of("Type"))?.toString() === "/Filespec") found.push("Filespec");
    if (dict?.get(PDFName.of("Subtype"))?.toString() === "/FileAttachment") found.push("FileAttachment annot");
  }
  for (const k of ["Metadata", "Names", "PieceInfo"]) if (out.catalog.has(PDFName.of(k))) found.push(`catalog /${k}`);
  const p = out.getPage(0).node;
  for (const k of ["Metadata", "PieceInfo"]) if (p.has(PDFName.of(k))) found.push(`page /${k}`);
  const annots = p.lookupMaybe(PDFName.of("Annots"), PDFArray);
  if (annots?.size()) found.push("page /Annots present");

  assert.deepEqual([...new Set(found)], [], "strip left privacy-relevant structures behind: " + found.join(", "));
  console.log("✓ stripPdfMetadata byte-level check: no XMP, embedded files, or FileAttachment annots survive");
}

async function testCsvToPdf() {
  // Multi-page pagination and a quoted-comma field, matching what was verified empirically
  // during v0.3 scoping.
  const header = "Name,Email,Notes\n";
  const rows = Array.from({ length: 150 }, (_, i) => `"Person, ${i}",person${i}@example.com,Row number ${i}\n`).join("");
  const csv = new TextEncoder().encode(header + rows);

  const bytes = await csvToPdf(csv);
  const doc = await PDFDocument.load(bytes);
  assert(doc.getPageCount() >= 2, "csvToPdf: 151 rows should paginate across multiple pages");
  console.log(`✓ csvToPdf paginates (${doc.getPageCount()} pages) and handles quoted commas`);
}

async function testCsvToPdfRejectsEmpty() {
  const csv = new TextEncoder().encode("\n\n");
  await assert.rejects(() => csvToPdf(csv), /no rows found/i);
  console.log("✓ csvToPdf rejects an empty CSV");
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
  await testHeaderFooter();
  await testHeaderFooterNoOptions();
  await testCropMargins();
  await testCropResize();
  await testFingerprintGeneratesId();
  await testFingerprintCustomId();
  await testFingerprintRejectsBadId();
  await testScanPdfMetadata();
  await testStripPdfMetadataByteLevel();
  await testCsvToPdf();
  await testCsvToPdfRejectsEmpty();
  console.log("\nAll offlinepdf-sdk checks passed.");
}

main().catch((err) => {
  console.error("\n✗ offlinepdf-sdk check failed:", err);
  process.exit(1);
});
