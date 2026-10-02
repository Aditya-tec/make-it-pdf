---
title: "How to Split a PDF File Free: Extract Pages Instantly"
excerpt: "Extract individual pages or custom page ranges from any PDF, all in your browser. No upload, no account, no watermark."
relatedTools: ["split-pdf", "merge-pdf", "organize-pages"]
---

## Why split a PDF?

Splitting a PDF is useful when you need to:

- Share only a specific section of a large report
- Extract a single page from a contract
- Break a 200-page scanned book into chapters
- Separate a combined bank statement into individual months

## How to split a PDF free: no upload

1. Open the **Split PDF** tool.
2. Drop your PDF onto the upload zone.
3. Choose your method:
   - **Click pages**: Thumbnail grid appears, click the pages you want to extract.
   - **Page ranges**: Type ranges like `1-3, 5, 7-10` for precise control.
4. Click **Split PDF**.
5. If you selected multiple pages, you get a ZIP file containing each as a separate PDF. Single-page extractions download directly as a PDF.

## Page range syntax explained

| Input | Result |
|-------|--------|
| `1` | Page 1 only |
| `1-5` | Pages 1 through 5 |
| `1-3, 7` | Pages 1, 2, 3, and 7 |
| `2, 4, 6` | Pages 2, 4, and 6 |

## Tips

- **Select all pages**: Leave the selection empty to split every page into its own PDF.
- **Large PDFs**: Thumbnail rendering for 300+ page PDFs may take a moment. Pages load as you scroll (lazy rendering).
- **After splitting**: Use [Merge PDF](/merge-pdf) to recombine selected pages in a new order.

## Is splitting PDFs safe without uploading?

Absolutely. Your PDF is processed using pdf-lib and pdf.js running as WebAssembly in your browser tab. The file bytes never travel over the network.
