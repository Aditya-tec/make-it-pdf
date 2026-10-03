// Run: npx tsx lib/privacyScanner.check.ts
// Builds a PDF carrying XMP, an embedded file, a file-attachment annotation and page-level metadata,
// runs the real Privacy Scanner strip path, then inspects every indirect object of the OUTPUT.
import assert from "node:assert/strict";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, PDFRef, PDFString, PDFHexString, PDFStream } from "pdf-lib";
import { run } from "./workers/engines/privacyScanner";

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
const [pdfOut] = await run([inBytes.buffer.slice(inBytes.byteOffset, inBytes.byteOffset + inBytes.byteLength) as ArrayBuffer], { strip: true }, () => {});
assert.equal(pdfOut.name, "cleaned.pdf");

// Inspect the output's real structure: every object, decoded to text.
const out = await PDFDocument.load(pdfOut.bytes);
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
void PDFRef; void PDFHexString;

console.log("leftovers in cleaned.pdf:", found.length ? [...new Set(found)] : "none");
assert.deepEqual([...new Set(found)], [], "strip left privacy-relevant structures behind");
console.log("privacyScanner strip check: OK");
