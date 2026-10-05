/**
 * Self-contained engine smoke test.
 * Run with: npx tsx engines.check.ts
 *
 * Creates minimal fixture PDFs in memory and asserts
 * that each engine returns bytes without throwing.
 * No framework, no fixtures on disk.
 */
import assert from "node:assert/strict";
import { PDFDict, PDFDocument, PDFName, PageSizes } from "pdf-lib";

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

async function testCsvQuotesAndPages() {
  const { parseCsv } = await import("./lib/pdf/csv.js");
  const rows = parseCsv('Name,Note\nAda,"hello, world"\n"quote ""x""",1\n');
  assert.deepEqual(rows[1], ["Ada", "hello, world"]);
  assert.equal(rows[2][0], 'quote "x"');
  const { run } = await import("./lib/workers/engines/csvToPdf.js");
  let csv = "H1,H2\n";
  for (let i = 0; i < 120; i++) csv += `r${i},v${i}\n`;
  const [out] = await run([new TextEncoder().encode(csv).buffer], {}, noop);
  const doc = await PDFDocument.load(out.bytes);
  assert.ok(doc.getPageCount() >= 2, "csv should paginate, pages=" + doc.getPageCount());
  console.log("✓ csv-to-pdf");
}

async function testMarkdownHtml() {
  const { run } = await import("./lib/workers/engines/markdownToPdf.js");
  const md = "# T\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n```\nconst x = 1;\n```\n\n<img src=x onerror=alert(1)>\n";
  const [out] = await run([new TextEncoder().encode(md).buffer], {}, noop);
  const html = new TextDecoder().decode(out.bytes);
  assert.match(html, /<table/);
  assert.match(html, /<pre/);
  assert.doesNotMatch(html, /<img/i);
  console.log("✓ markdown-to-pdf");
}

async function testTextToPdf() {
  const { run } = await import("./lib/workers/engines/txtToPdf.js");
  const txt = "Line one\nLine two  with  spaces\n<not a tag>\n";
  const [out] = await run([new TextEncoder().encode(txt).buffer], {}, noop);
  const html = new TextDecoder().decode(out.bytes);
  assert.match(html, /<pre>/);
  assert.doesNotMatch(html, /<not a tag>/);
  assert.match(html, /&lt;not a tag&gt;/);
  console.log("✓ text-to-pdf");
}

async function testRepair() {
  const { run } = await import("./lib/workers/engines/repairPdf.js");
  const [out] = await run([await makePdf(1)], {}, noop);
  assert.equal(out.name, "repaired.pdf");
  await PDFDocument.load(out.bytes);
  try {
    const bad = await run([new Uint8Array([1, 2, 3, 4]).buffer], {}, noop);
    assert.notEqual(bad[0].name, "repaired.pdf");
    await PDFDocument.load(bad[0].bytes);
  } catch (e) {
    assert.match(String(e), /damaged|recover|PDF|isolated/i);
  }
  console.log("✓ repair-pdf");
}

async function testExcelFirstSheet() {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name", "Qty"], ["A", 1], ["B", 2]]), "Data");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["skip"]]), "Other");
  const raw = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as number[];
  const { run } = await import("./lib/workers/engines/excelToPdf.js");
  const [out] = await run([new Uint8Array(raw).buffer], {}, noop);
  const doc = await PDFDocument.load(out.bytes);
  assert.equal(out.name, "spreadsheet.pdf");
  assert.ok(doc.getPageCount() >= 1);
  console.log("✓ excel-to-pdf");
}

async function testPixelDiff() {
  const { paintDiff } = await import("./lib/pdf/pixelDiff.js");
  const a = new Uint8ClampedArray([0, 0, 0, 255, 10, 10, 10, 255]);
  const b = new Uint8ClampedArray([0, 0, 0, 255, 200, 10, 10, 255]);
  const out = new Uint8ClampedArray(b);
  paintDiff(a, b, out);
  assert.equal(out[0], 0);
  assert.equal(out[4], 255);
  console.log("✓ pixel diff");
}

// --- batch 3 ----------------------------------------------------------------

async function testTableDetect() {
  const { boxesToRows } = await import("./lib/pdf/tableDetect.js");
  const b = (str: string, x: number, y: number) => ({ str, x, y, w: str.length * 5, h: 10 });
  const rows = boxesToRows([b("Item", 50, 700), b("Qty", 200, 700), b("Price", 300, 700), b("Apple", 50, 680), b("3", 200, 680), b("1,200.50", 300, 680)]);
  assert.deepEqual(rows, [["Item", "Qty", "Price"], ["Apple", 3, 1200.5]]);
  console.log("✓ table detection");
}

async function testPos() {
  const { calc } = await import("./lib/pos.js");
  const ex = calc([{ name: "A", price: 100, qty: 2, gst: 18 }], false);
  assert.deepEqual([ex.taxable, ex.gst, ex.total], [20000, 3600, 23600]);
  const inc = calc([{ name: "A", price: 118, qty: 1, gst: 18 }], true);
  assert.deepEqual([inc.taxable, inc.gst, inc.total], [10000, 1800, 11800]);
  const odd = calc([{ name: "A", price: 0.05, qty: 1, gst: 18 }], false); // 1 paisa tax: split must still add up
  assert.equal(odd.slabs[0].cgst + odd.slabs[0].sgst, odd.gst);
  assert.throws(() => calc([{ name: "A", price: 1, qty: 1.5, gst: 5 }], false));
  assert.throws(() => calc([], false));
  const { run } = await import("./lib/workers/engines/posBilling.js");
  for (const width of ["80mm", "58mm", "a4"]) {
    const out = await run([new ArrayBuffer(1)], { shop: "Shop <b>", width, items: [{ name: "Tea", price: 10, qty: 2, gst: 5 }] }, noop);
    const w = (await PDFDocument.load(out[0].bytes)).getPage(0).getWidth();
    assert.ok(width === "a4" ? w > 590 : width === "80mm" ? Math.abs(w - 226.77) < 1 : Math.abs(w - 164.41) < 1, `pos width ${width}: ${w}`);
  }
  console.log("✓ pos billing (GST maths, widths)");
}

async function testFingerprint() {
  const { run } = await import("./lib/workers/engines/fingerprintPdf.js");
  const out = await run([await makePdf(2)], { id: "FP-0A1B2C3D-LZ4K9ABC", label: "Acme" }, noop);
  const doc = await PDFDocument.load(out[0].bytes);
  const info = doc.context.lookup(doc.context.trailerInfo.Info, PDFDict);
  assert.match(String(info.get(PDFName.of("OfflinePDFFingerprint"))), /FP-0A1B2C3D-LZ4K9ABC Acme/, "fingerprint in metadata");
  assert.equal(doc.getPageCount(), 2);
  await assert.rejects(run([await makePdf(1)], { id: "<script>" }, noop), /Invalid/);
  console.log("✓ fingerprint-pdf");
}

async function testEditText() {
  const { run } = await import("./lib/workers/engines/editPdfText.js");
  const e = { page: 0, x: 50, y: 700, w: 60, h: 12, family: "serif" };
  const out = await run([await makePdf(1)], { edits: [{ ...e, text: "Changed" }] }, noop);
  assert.equal((await PDFDocument.load(out[0].bytes)).getPageCount(), 1);
  await assert.rejects(run([await makePdf(1)], { edits: [] }, noop), /No edits/);
  await assert.rejects(run([await makePdf(1)], { edits: [{ ...e, page: 9, text: "x" }] }, noop), /outside/);
  await assert.rejects(run([await makePdf(1)], { edits: [{ ...e, text: "漢字" }] }, noop), /characters/);
  console.log("✓ edit-pdf-text");
}

async function testAutoCrop() {
  const { autoCrop } = await import("./lib/pdf/autoCrop.js");
  const w = 40, h = 40, d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const paper = x >= 10 && x < 30 && y >= 8 && y < 32;
    d.set([paper ? 240 : 30, paper ? 240 : 30, paper ? 240 : 30, 255], (y * w + x) * 4);
  }
  const box = autoCrop(d, w, h)!;
  assert.ok(box && Math.abs(box.x0 - 0.25) < 0.1 && Math.abs(box.x1 - 0.75) < 0.1 && Math.abs(box.y0 - 0.2) < 0.1, "paper box found");
  assert.equal(autoCrop(new Uint8ClampedArray(w * h * 4).fill(128), w, h), null, "flat image: nothing to crop");
  console.log("✓ auto-crop");
}

async function testOfficeAndEpub() {
  const { zipSync, strToU8 } = await import("fflate");
  const { run: pptx } = await import("./lib/workers/engines/pptxToPdf.js");
  const evil = "&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;";
  const ppt = zipSync({
    "ppt/presentation.xml": strToU8(`<p:presentation><p:sldSz cx="9144000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>`),
    "ppt/_rels/presentation.xml.rels": strToU8(`<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/></Relationships>`),
    "ppt/slides/slide1.xml": strToU8(`<p:sld><p:sp><a:off x="0" y="0"/><a:ext cx="100" cy="100"/><a:p><a:r><a:t>${evil}</a:t></a:r></a:p></p:sp></p:sld>`),
  });
  const html = Buffer.from((await pptx([ppt.buffer as ArrayBuffer], {}, noop))[0].bytes).toString();
  assert.ok(!/<script|<img/i.test(html) && html.includes("&lt;script&gt;"), "pptx: text is escaped, not markup");
  await assert.rejects(pptx([zipSync({ "a.txt": strToU8("x") }).buffer as ArrayBuffer], {}, noop), /PowerPoint/);

  const { run: epub } = await import("./lib/workers/engines/epubToPdf.js");
  const book = (extra: Record<string, Uint8Array> = {}) =>
    zipSync({
      "META-INF/container.xml": strToU8(`<container><rootfiles><rootfile full-path="OEBPS/c.opf"/></rootfiles></container>`),
      "OEBPS/c.opf": strToU8(`<package><manifest><item id="a" href="a.xhtml"/></manifest><spine><itemref idref="a"/></spine></package>`),
      "OEBPS/a.xhtml": strToU8(`<html><body><p>Hello</p><img src="http://evil.example/x.png"/><img src="//evil.example/y.png"/></body></html>`),
      ...extra,
    }).buffer as ArrayBuffer;
  const out = Buffer.from((await epub([book()], {}, noop))[0].bytes).toString();
  assert.ok(out.includes("Hello") && !out.includes("evil.example"), "epub: remote image URLs dropped");
  await assert.rejects(
    epub([book({ "META-INF/encryption.xml": strToU8(`<encryption><EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/></encryption>`) })], {}, noop),
    /DRM/
  );
  await assert.rejects(epub([zipSync({ "a.txt": strToU8("x") }).buffer as ArrayBuffer], {}, noop), /EPUB/);
  console.log("✓ pptx + epub engines (escaping, remote src, DRM, wrong type)");
}

async function testP2pInputs() {
  const { parseMsg, safeName, ROOM_RE, newRoomId } = await import("./lib/p2p/room.js");
  const s = (o: unknown) => JSON.stringify(o);
  assert.deepEqual(parseMsg(s({ t: "s", c: "#aabbcc", w: 4, pts: [[0.5, 2], [-1, 0.1]] })), { t: "s", c: "#aabbcc", w: 4, pts: [[0.5, 1], [0, 0.1]] }, "coords clamped");
  for (const bad of [
    s({ t: "s", c: "red;background:url(x)", w: 4, pts: [[0, 0]] }),
    s({ t: "s", c: "#aabbcc", w: 9999, pts: [[0, 0]] }),
    s({ t: "s", c: "#aabbcc", w: 4, pts: Array(2001).fill([0, 0]) }),
    s({ t: "s", c: "#aabbcc", w: 4, pts: [["a", 0]] }),
    s({ t: "other" }),
    "not json",
  ]) assert.equal(parseMsg(bad), null, bad.slice(0, 40));
  assert.deepEqual(parseMsg(s({ t: "clear", extra: 1 })), { t: "clear" });
  assert.equal(safeName("..\\..\\evil/../a<b>.pdf"), "a" + "b.pdf");
  assert.equal(safeName(""), "received-file");
  assert.ok(ROOM_RE.test(newRoomId()) && !ROOM_RE.test("opdf-xyz"));
  console.log("✓ p2p/whiteboard input validation");
}

async function testChunkText() {
  const { chunkText } = await import("./lib/chunkText.js");
  const chunks = chunkText("--- Page 1 ---\n" + "Word ".repeat(200) + ". Short one. Another!");
  assert.ok(chunks.every((c) => c.length <= 220) && chunks.length > 2 && !chunks.join(" ").includes("--- Page"));
  console.log("✓ pdf-to-audio chunking");
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
    await testCsvQuotesAndPages();
    await testMarkdownHtml();
    await testTextToPdf();
    await testRepair();
    await testExcelFirstSheet();
    await testPixelDiff();
    await testTableDetect();
    await testPos();
    await testFingerprint();
    await testEditText();
    await testAutoCrop();
    await testOfficeAndEpub();
    await testP2pInputs();
    await testChunkText();
    console.log("\nAll engine checks passed ✓");
  } catch (err) {
    console.error("\nEngine check FAILED:", err);
    process.exit(1);
  }
})();
