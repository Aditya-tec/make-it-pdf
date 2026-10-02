---
title: "How to Convert Word to PDF Free — No Microsoft Office Needed"
excerpt: "Convert .docx Word documents to PDF directly in your browser, without installing Microsoft Office or uploading to a server."
relatedTools: ["word-to-pdf", "merge-pdf", "extract-text"]
---

## Do I need Microsoft Word installed?

No. This tool uses mammoth.js — an open-source library that reads .docx files directly — combined with your browser's built-in print-to-PDF capability. You don't need Word, LibreOffice, or any desktop software.

## What is a .docx file?

.docx is the default format for Microsoft Word documents (Word 2007 and later). It is a ZIP archive containing XML and media files. Most word processors — including Google Docs, LibreOffice, and Apple Pages — can export to .docx.

## How to convert Word to PDF free

1. Open the **Word to PDF** tool.
2. Click **Select file** and choose your .docx file.
3. Click **Convert to PDF**.
4. Wait while the document is parsed and rendered.
5. A preview of the converted document appears in an iframe.
6. Click **Save as PDF** — your browser opens the print dialog.
7. In the print dialog, set the **Destination** to **Save as PDF** (or "Microsoft Print to PDF" on Windows).
8. Click Save.

## Formatting fidelity — what to expect

The conversion preserves:
- Headings (H1, H2, H3)
- Bold and italic text
- Tables (basic layout)
- Images

Complex layouts may differ slightly from the original Word rendering:
- Exact line spacing and character spacing
- Custom fonts not available in the browser
- Advanced table styles

This is a browser-side limitation, not a bug. For pixel-perfect conversion, use Microsoft Word's built-in Export to PDF or a desktop tool like LibreOffice.

## Privacy: where does my .docx go?

Nowhere. mammoth.js reads the file in your browser's memory. The file is never sent to any server.

## What about .doc files (old Word format)?

Only .docx is supported. Convert your .doc file to .docx in Word (File → Save As → .docx) before using this tool.
