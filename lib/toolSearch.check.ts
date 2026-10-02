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
];
for (const [q, slug] of cases) {
  const got = rankTools(q)[0]?.tool.slug;
  assert.equal(got, slug, `"${q}" -> ${got}, expected ${slug}`);
}
assert.deepEqual(rankTools("   "), []);
assert.deepEqual(rankTools("xqzvw"), []);
console.log("toolSearch ok");
