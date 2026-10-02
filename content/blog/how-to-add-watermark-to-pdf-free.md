---
title: "How to Add a Watermark to a PDF Free — Text or Image"
excerpt: "Overlay a text watermark on every page of your PDF. Control opacity, rotation and size — all without uploading your file."
relatedTools: ["add-watermark", "organize-pages", "encrypt-pdf"]
---

## What is a PDF watermark?

A watermark is semi-transparent text or an image overlaid on every page of a PDF. Common uses:

- Marking a document as **DRAFT**, **CONFIDENTIAL**, or **SAMPLE**
- Branding a document with your company name
- Discouraging unauthorised distribution

## How to add a watermark to a PDF free

1. Open the **Add Watermark** tool.
2. Drop your PDF onto the upload zone.
3. Configure the watermark:
   - **Text**: Type your watermark text (e.g. "CONFIDENTIAL").
   - **Font size**: Larger text is more visible; 48pt is a good default.
   - **Opacity**: Lower values are more subtle. 30% is standard for draft marks.
   - **Rotation**: 45° diagonal is the classic watermark style.
4. Preview the watermark in the live preview box.
5. Click **Apply Watermark**.
6. Download the watermarked PDF.

## Tips

- **Contrast**: Dark text on light backgrounds reads well at 20–30% opacity. Light text may not be visible on white pages.
- **Placement**: The watermark is centred on each page. Pages of different sizes (A4 vs Letter) are handled automatically.
- **Removal**: A simple text watermark can be removed by someone with the right tools. For security, also [encrypt the PDF](/encrypt-pdf) so it cannot be easily edited.

## Is this really done in my browser?

Yes. pdf-lib (a WebAssembly library) draws the text directly onto each page of your PDF without uploading it. The file never leaves your device.

## Can I watermark only some pages?

Currently the watermark is applied to all pages. Page-level control is on the roadmap.
