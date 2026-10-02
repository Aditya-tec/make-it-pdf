/** Writes 10 how-to blog posts for the new tools. */
import fs from "node:fs";

const posts = [
  ["how-to-rotate-pdf-free", "How to Rotate a PDF Free — 90°, 180°, or 270°", "Rotate every page of a PDF in your browser. Additive rotation, no upload.", ["rotate-pdf", "organize-pages", "crop-resize"]],
  ["how-to-crop-resize-pdf-free", "How to Crop or Resize a PDF Free", "Trim margins or resize pages to A4/Letter with contain or stretch — entirely offline.", ["crop-resize", "rotate-pdf", "compress-pdf"]],
  ["how-to-add-page-numbers-to-pdf-free", "How to Add Page Numbers to a PDF Free", "Number your PDF with format, start number, and skip-cover options. No signup.", ["page-numbers", "headers-footers", "add-watermark"]],
  ["how-to-add-headers-footers-pdf-free", "How to Add Headers and Footers to a PDF Free", "Put header/footer text, date, and page numbers on every page in your browser.", ["headers-footers", "page-numbers", "add-watermark"]],
  ["how-to-remove-pdf-password-free", "How to Remove a PDF Password Free (If You Know It)", "Unlock a password-protected PDF when you have the password. Nothing is uploaded.", ["remove-password", "encrypt-pdf", "privacy-scanner"]],
  ["how-to-ocr-pdf-free", "How to OCR a PDF Free — Make Scans Searchable", "Turn a scanned PDF into a searchable document with in-browser OCR. No CDN language downloads.", ["ocr-pdf", "extract-text", "compress-pdf"]],
  ["how-to-flatten-pdf-free", "How to Flatten a PDF Free — Lock Form Fields", "Bake form field values into the page so they stay visible but can no longer be edited.", ["flatten-pdf", "redact-pdf", "encrypt-pdf"]],
  ["how-to-redact-pdf-free", "How to Redact a PDF Free — Permanently Black Out Text", "Draw black boxes that permanently remove content (not just paint over it) — all in your browser.", ["redact-pdf", "privacy-scanner", "flatten-pdf"]],
  ["how-to-invert-pdf-colors-free", "How to Invert PDF Colours Free — Dark Mode & Grayscale", "Convert pages to inverted, grayscale, or sepia for easier reading. Runs on your device.", ["invert-colors", "compress-pdf", "pdf-to-jpg"]],
  ["how-to-strip-pdf-metadata-free", "How to Strip PDF Metadata Free — Privacy Scanner", "See author, creator app, and timestamps hidden in your PDF, then download a cleaned copy.", ["privacy-scanner", "encrypt-pdf", "redact-pdf"]],
];

for (const [slug, title, excerpt, related] of posts) {
  const body = `---
title: "${title}"
excerpt: "${excerpt}"
relatedTools: ${JSON.stringify(related)}
---

## ${title.split("—")[0].trim()}

${excerpt}

## Steps

1. Open the matching tool on this site.
2. Drop your PDF onto the upload zone (nothing is uploaded to a server).
3. Choose your options and run the tool.
4. Rename the output if you like, then download.

## Privacy

All processing happens in your browser. For OCR, the English language model is served from this site — not a third-party CDN.

## Related tools

See the links below for tools that pair well with this one.
`;
  fs.writeFileSync(`content/blog/${slug}.md`, body);
  console.log(slug);
}
