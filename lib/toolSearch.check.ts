import assert from "node:assert/strict";
import { rankTools } from "./toolSearch";

const cases: [string, string][] = [
  ["make my pdf smaller", "compress-pdf"],
  ["I need a searchable scan", "ocr-pdf"],
  ["lock this with a password", "encrypt-pdf"],
  ["compres", "compress-pdf"],
  ["comrpess my file", "compress-pdf"],
  ["mrege", "merge-pdf"],
  ["combine two files into one", "merge-pdf"],
  ["unlock pdf", "remove-password"],
  ["forgot password", "remove-password"],
  ["black out names", "redact-pdf"],
  ["turn my photos into a pdf", "images-to-pdf"],
  ["pdf to png", "pdf-to-jpg"],
  ["docx", "word-to-pdf"],
  ["rotat", "rotate-pdf"],
  ["add page numbers", "page-numbers"],
  ["remove metadata", "privacy-scanner"],
  ["dark mode", "invert-colors"],
  ["delete pages", "organize-pages"],
  ["extract text", "extract-text"],
  ["markdown to pdf", "markdown-to-pdf"],
  ["compare two pdfs", "compare-pdfs"],
  ["repair broken pdf", "repair-pdf"],
  ["csv to pdf", "csv-to-pdf"],
  ["epub", "pdf-to-epub"],
  ["pdf to word", "pdf-to-word"],
  ["convert powerpoint to pdf", "powerpoint-to-pdf"],
  ["turn my pdf into slides", "pdf-to-powerpoint"],
  ["scan documents with camera", "scan-to-pdf"],
  ["read aloud", "pdf-to-audio"],
  ["edit text in pdf", "edit-pdf-text"],
  ["whiteboard", "whiteboard"],
  ["send a file to a friend", "p2p-share"],
];
for (const [q, slug] of cases) {
  const got = rankTools(q)[0]?.tool.slug;
  assert.equal(got, slug, `"${q}" -> ${got}, expected ${slug}`);
}
assert.deepEqual(rankTools("   "), []);
assert.deepEqual(rankTools("xqzvw"), []);
console.log("toolSearch ok");
