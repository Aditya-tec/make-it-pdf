export interface Tool {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // emoji or SVG path name
  category: "essentials" | "edit" | "security" | "convert" | "more";
  howTo: string[];
  faq: { q: string; a: string }[];
  related: string[]; // slugs
}

export const TOOLS: Tool[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    tagline: "Combine multiple PDFs into one file",
    description:
      "Drag in your PDFs, rearrange them in any order, and download a single merged PDF. Processing stays in the browser — no upload, no watermark, no signup.",
    icon: "🔗",
    category: "essentials",
    howTo: [
      "Click 'Select files' or drag your PDFs onto the drop zone.",
      "Drag the file cards to set the order you want.",
      "Click 'Merge PDFs' and wait for the progress bar.",
      "Download your merged PDF.",
    ],
    faq: [
      {
        q: "Is there a file size limit?",
        a: "OfflinePDF's Merge PDF tool allows up to 300 MB per file and 600 MB total. Heavier tools such as Compress PDF and OCR PDF enforce lower caps because they use more browser memory.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: "OfflinePDF's Merge PDF tool combines files entirely in the browser using WebAssembly; no file is uploaded to any server during the process.",
      },
      {
        q: "What if one of my PDFs is password-protected?",
        a: "A password-protected PDF must be unlocked before merging: open it in a PDF viewer, enter the password, save or print a copy without a password, then run OfflinePDF's Merge PDF tool — or use OfflinePDF's Remove Password tool first.",
      },
    ],
    related: ["split-pdf", "compress-pdf", "organize-pages"],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    tagline: "Split a PDF into individual pages or custom ranges",
    description:
      "Select individual pages or define page ranges to extract. Download each part as a separate PDF or get them all in one zip file.",
    icon: "✂️",
    category: "essentials",
    howTo: [
      "Drop your PDF onto the upload zone.",
      "Choose pages to extract by clicking page thumbnails, or set ranges like 1-3, 5.",
      "Click 'Split PDF'.",
      "Download individual pages or all as a zip.",
    ],
    faq: [
      {
        q: "Can I extract a range of pages?",
        a: "OfflinePDF's Split PDF tool accepts ranges such as '1-3, 5, 7-10' in the range input, and also lets users click page thumbnails to select individual pages.",
      },
      {
        q: "Will I get one file or many?",
        a: "When OfflinePDF's Split PDF tool extracts multiple pages, the results are zipped automatically; a single-page extract downloads as a plain PDF.",
      },
    ],
    related: ["merge-pdf", "organize-pages", "compress-pdf"],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    tagline: "Reduce PDF file size without a watermark",
    description:
      "Shrink your PDF using image re-encoding. Choose Light, Medium, or Heavy compression and see the real before/after size before you download.",
    icon: "🗜️",
    category: "essentials",
    howTo: [
      "Upload your PDF.",
      "Choose a compression level: Light, Medium, or Heavy.",
      "Click 'Compress', the before/after size appears when done.",
      "Download only if you're happy with the result.",
    ],
    faq: [
      {
        q: "Why didn't my file shrink much?",
        a: "OfflinePDF's Compress PDF tool mainly re-encodes embedded raster images, so text-only PDFs often shrink only a little; the tool always shows the real before-and-after file size before download.",
      },
      {
        q: "Does compression affect text quality?",
        a: "OfflinePDF's Compress PDF tool leaves text and vector content untouched; only embedded raster images are re-encoded.",
      },
    ],
    related: ["merge-pdf", "pdf-to-jpg", "images-to-pdf"],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    tagline: "Convert PDF pages to high-quality JPG images",
    description:
      "Render each page of your PDF to a JPG (or PNG) image. Choose your DPI. Get a zip file for multi-page PDFs.",
    icon: "🖼️",
    category: "convert",
    howTo: [
      "Upload your PDF.",
      "Choose output format (JPG or PNG) and DPI.",
      "Click 'Convert' and wait for rendering.",
      "Download individual images or the zip file.",
    ],
    faq: [
      {
        q: "What DPI should I choose?",
        a: "For OfflinePDF's PDF to JPG tool, 72 DPI suits web previews, 150 DPI suits general use, and 300 DPI suits print; higher DPI produces larger files and uses more memory.",
      },
      {
        q: "Why is high DPI slow on mobile?",
        a: "Rendering a large PDF page at 300 DPI in OfflinePDF's PDF to JPG tool is memory-intensive on phones; the tool caps memory use and warns when a page is very large.",
      },
    ],
    related: ["pdf-to-zip", "images-to-pdf", "compress-pdf"],
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    tagline: "Convert JPG, PNG, or WebP images to a PDF",
    description:
      "Select one or more images, set the page size and orientation, and get a PDF with each image on its own page.",
    icon: "📸",
    category: "convert",
    howTo: [
      "Drop your images (JPG, PNG, WebP, GIF) onto the upload zone.",
      "Reorder them by dragging.",
      "Choose page size (fit to image, A4, Letter).",
      "Click 'Create PDF' and download.",
    ],
    faq: [
      {
        q: "What image formats are supported?",
        a: "OfflinePDF's Images to PDF tool accepts JPG, PNG, WebP, and GIF, and places each image on its own page.",
      },
      {
        q: "Can I mix portrait and landscape images?",
        a: "OfflinePDF's Images to PDF tool sizes each page to the image by default, so mixed portrait and landscape images work without forcing a single orientation.",
      },
    ],
    related: ["scan-to-pdf", "pdf-to-jpg", "merge-pdf"],
  },
  {
    slug: "word-to-pdf",
    name: "Word to PDF",
    tagline: "Convert .docx files to PDF in your browser",
    description:
      "Upload a .docx Word file and convert it to PDF without Microsoft Word or any server. Formatting fidelity is good, not pixel-perfect.",
    icon: "📝",
    category: "convert",
    howTo: [
      "Click 'Select file' and choose your .docx file.",
      "Click 'Convert to PDF'.",
      "Preview the result and download.",
    ],
    faq: [
      {
        q: "Is the formatting exactly like Word?",
        a: "OfflinePDF's Word to PDF tool reaches good fidelity for most documents, but complex layouts with exact spacing can differ slightly because conversion runs in the browser rather than Microsoft Word.",
      },
      {
        q: "What about .doc files (older Word format)?",
        a: "OfflinePDF's Word to PDF tool supports only .docx; convert an older .doc file to .docx in Word first, then convert with OfflinePDF.",
      },
    ],
    related: ["pdf-to-word", "powerpoint-to-pdf", "extract-text"],
  },
  {
    slug: "organize-pages",
    name: "Organize Pages",
    tagline: "Reorder, rotate, and delete PDF pages",
    description:
      "See page thumbnails, drag to reorder, rotate any page 90°, and delete pages you don't want. Undo any mistake. Download the new PDF when ready.",
    icon: "🗂️",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Drag page thumbnails to reorder.",
      "Click the rotate icon to rotate a page, or the trash icon to delete.",
      "Use Undo if you make a mistake.",
      "Click 'Save PDF' and download.",
    ],
    faq: [
      {
        q: "How many undo steps are available?",
        a: "OfflinePDF's Organize Pages tool keeps unlimited undo history in browser memory until the tab is closed.",
      },
      {
        q: "Is there a page limit?",
        a: "OfflinePDF's Organize Pages tool has no hard page limit; PDFs with 300 or more pages may take longer to render thumbnails in the browser.",
      },
    ],
    related: ["split-pdf", "merge-pdf", "add-watermark"],
  },
  {
    slug: "add-watermark",
    name: "Add Watermark",
    tagline: "Add text or image watermark to every page",
    description:
      "Overlay a text or image watermark on every page of your PDF. Control position, opacity, rotation, and font size.",
    icon: "💧",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Choose text or image watermark.",
      "Set position, opacity, and rotation.",
      "Click 'Apply Watermark' and download.",
    ],
    faq: [
      {
        q: "Can I watermark only specific pages?",
        a: "OfflinePDF's Add Watermark tool currently applies the watermark to every page; per-page control is on the roadmap.",
      },
      {
        q: "What image formats work for watermarks?",
        a: "OfflinePDF's Add Watermark tool accepts PNG (best with transparency) and JPG for image watermarks.",
      },
    ],
    related: ["fingerprint-pdf", "organize-pages", "encrypt-pdf"],
  },
  {
    slug: "encrypt-pdf",
    name: "Encrypt PDF",
    tagline: "Password-protect your PDF with AES-256",
    description:
      "Set a password on your PDF using AES-256 encryption. The file is processed entirely in your browser, we never see your password or your file.",
    icon: "🔒",
    category: "security",
    howTo: [
      "Upload your PDF.",
      "Enter and confirm the password you want to set.",
      "Click 'Encrypt PDF'.",
      "Download the password-protected file.",
    ],
    faq: [
      {
        q: "Can I remove the password later?",
        a: "A password set with OfflinePDF's Encrypt PDF tool can be removed later with OfflinePDF's Remove Password tool using the same password, or by opening the PDF in a viewer and saving or printing a copy without a password.",
      },
      {
        q: "What encryption standard is used?",
        a: "OfflinePDF's Encrypt PDF tool uses AES-256 encryption and runs entirely in the browser; the password and file are never sent to a server.",
      },
    ],
    related: ["remove-password", "add-watermark", "privacy-scanner"],
  },
  {
    slug: "extract-text",
    name: "Extract Text",
    tagline: "Copy all text from a PDF to plain text",
    description:
      "Extract the full text content from a PDF with one click. Download as a .txt file or copy to clipboard. Detects scanned (image-only) PDFs automatically.",
    icon: "📋",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Click 'Extract Text'.",
      "Review the extracted text.",
      "Click 'Copy' or 'Download as .txt'.",
    ],
    faq: [
      {
        q: "Why is the text empty for my PDF?",
        a: "An empty result from OfflinePDF's Extract Text tool usually means the PDF is a scanned image; run OfflinePDF's OCR PDF tool first to add a searchable text layer, then extract again.",
      },
      {
        q: "Is formatting preserved?",
        a: "OfflinePDF's Extract Text tool keeps basic line breaks and spacing in plain text, but complex layouts such as columns and tables may not match the original PDF layout.",
      },
    ],
    related: ["pdf-to-word", "pdf-to-epub", "ocr-pdf"],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    tagline: "Rotate every page 90°, 180°, or 270°",
    description:
      "Rotate an entire PDF in your browser. Rotation is additive, already-rotated pages keep their orientation and get another turn.",
    icon: "🔄",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Choose 90°, 180°, or 270°.",
      "Click Rotate and download.",
    ],
    faq: [
      {
        q: "Does this reset previous rotation?",
        a: "OfflinePDF's Rotate PDF tool does not reset prior rotation; each new turn is added on top of the page's existing orientation.",
      },
      {
        q: "Can I rotate single pages?",
        a: "Per-page rotate, reorder, and delete are available in OfflinePDF's Organize Pages tool; Rotate PDF applies one angle to every page.",
      },
    ],
    related: ["organize-pages", "crop-resize", "split-pdf"],
  },
  {
    slug: "crop-resize",
    name: "Crop & Resize",
    tagline: "Crop margins or resize pages to A4/Letter",
    description:
      "Trim margins by percentage, or resize every page to A4 or Letter. Choose whether to keep aspect ratio (contain) or stretch to fill.",
    icon: "✂️",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Pick Crop margins or Resize to page size.",
      "Set margins or target size and fit mode.",
      "Download the result.",
    ],
    faq: [
      {
        q: "Contain vs stretch: what's the difference?",
        a: "In OfflinePDF's Crop & Resize tool, Contain keeps the page aspect ratio and may leave empty margins, while Stretch fills the target page size and may distort content.",
      },
    ],
    related: ["rotate-pdf", "organize-pages", "compress-pdf"],
  },
  {
    slug: "page-numbers",
    name: "Page Numbers",
    tagline: "Add page numbers with format and position",
    description:
      "Number every page (or skip a cover). Choose format, starting number, font size, and position, all in your browser.",
    icon: "🔢",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Pick format, start number, and position.",
      "Optionally skip the first (cover) page.",
      "Apply and download.",
    ],
    faq: [
      {
        q: "Can I start at a number other than 1?",
        a: "OfflinePDF's Page Numbers tool lets the starting number be set to any value before applying numbers to the PDF.",
      },
    ],
    related: ["headers-footers", "add-watermark", "organize-pages"],
  },
  {
    slug: "headers-footers",
    name: "Headers & Footers",
    tagline: "Add header and footer text to every page",
    description:
      "Put a header and/or footer on every page, with optional date and page numbers. A light band keeps text readable on full-bleed pages.",
    icon: "📰",
    category: "edit",
    howTo: [
      "Upload your PDF.",
      "Enter header and/or footer text.",
      "Toggle date and page numbers if you want them.",
      "Apply and download.",
    ],
    faq: [
      {
        q: "Will the header cover my content?",
        a: "OfflinePDF's Headers & Footers tool draws a semi-transparent white band behind header and footer text so the text stays readable on dark or full-bleed pages.",
      },
    ],
    related: ["page-numbers", "add-watermark", "organize-pages"],
  },
  {
    slug: "remove-password",
    name: "Remove Password",
    tagline: "Unlock a PDF when you know the password",
    description:
      "Decrypt a password-protected PDF using the correct password. Processing stays in your browser, the password is never uploaded.",
    icon: "🔓",
    category: "security",
    howTo: [
      "Upload the encrypted PDF.",
      "Enter the current password.",
      "Click Remove Password.",
      "Download the unlocked file.",
    ],
    faq: [
      {
        q: "What if the password is wrong?",
        a: "OfflinePDF's Remove Password tool shows a clear error when the password is wrong, and never sends the password or the PDF file to a server.",
      },
    ],
    related: ["encrypt-pdf", "privacy-scanner", "flatten-pdf"],
  },
  {
    slug: "ocr-pdf",
    name: "OCR PDF",
    tagline: "Make a scanned PDF searchable",
    description:
      "Run OCR on scanned pages and download a searchable PDF with an invisible text layer. English is bundled locally, nothing is fetched from a CDN.",
    icon: "👁️",
    category: "edit",
    howTo: [
      "Upload a scanned or image-only PDF.",
      "Click Run OCR and watch per-page progress.",
      "Download the searchable PDF.",
    ],
    faq: [
      {
        q: "Is there a page limit?",
        a: "OfflinePDF's OCR PDF tool is capped at 75 pages to stay within typical browser memory; larger scans should be split first with OfflinePDF's Split PDF tool.",
      },
      {
        q: "Does this upload my file?",
        a: "OfflinePDF's OCR PDF tool does not upload the file; the OCR engine and English language model are served from the OfflinePDF site and run entirely on the user's device.",
      },
    ],
    related: ["extract-text", "pdf-to-epub", "pdf-to-jpg"],
  },
  {
    slug: "flatten-pdf",
    name: "Flatten PDF",
    tagline: "Bake form fields into static page content",
    description:
      "Flatten interactive form fields and annotations so values stay visible but can no longer be edited.",
    icon: "📄",
    category: "security",
    howTo: [
      "Upload a PDF that has form fields.",
      "Click Flatten.",
      "Download the static PDF.",
    ],
    faq: [
      {
        q: "Are filled-in values kept?",
        a: "OfflinePDF's Flatten PDF tool bakes filled-in form field values into the page appearance, then removes the interactive fields so the values stay visible but are no longer editable.",
      },
    ],
    related: ["redact-pdf", "encrypt-pdf", "privacy-scanner"],
  },
  {
    slug: "redact-pdf",
    name: "Redact PDF",
    tagline: "Permanently black out sensitive regions",
    description:
      "Draw black boxes over sensitive areas. Redacted pages are re-rendered so the underlying text cannot be selected or extracted.",
    icon: "⬛",
    category: "security",
    howTo: [
      "Upload your PDF.",
      "Draw boxes over areas to remove.",
      "Apply redaction and download.",
    ],
    faq: [
      {
        q: "Is the text really gone?",
        a: "OfflinePDF's Redact PDF tool re-renders redacted pages as images with black boxes burned in, so text under a box cannot be selected or recovered with Extract Text.",
      },
    ],
    related: ["compare-pdfs", "edit-pdf-text", "privacy-scanner"],
  },
  {
    slug: "invert-colors",
    name: "Invert Colours",
    tagline: "Dark mode, grayscale, or sepia pages",
    description:
      "Re-render pages inverted, grayscale, or sepia. Pages become images (text is no longer selectable), labeled clearly before you run.",
    icon: "🌙",
    category: "convert",
    howTo: [
      "Upload your PDF.",
      "Choose Invert, Grayscale, or Sepia.",
      "Convert and download.",
    ],
    faq: [
      {
        q: "Can I still select text afterward?",
        a: "After OfflinePDF's Invert Colours tool runs, text is no longer selectable because pages are re-rendered as images so colours can be remapped; the tool is intended for reading comfort, not for editable text.",
      },
    ],
    related: ["compress-pdf", "pdf-to-jpg", "ocr-pdf"],
  },
  {
    slug: "privacy-scanner",
    name: "Privacy Scanner",
    tagline: "Find and strip PDF metadata",
    description:
      "Scan for author, creator app, timestamps and other metadata, then optionally download a cleaned PDF with those fields removed.",
    icon: "🕵️",
    category: "security",
    howTo: [
      "Upload your PDF.",
      "Review the findings list.",
      "Click Strip & download to remove them.",
    ],
    faq: [
      {
        q: "What gets removed?",
        a: "OfflinePDF's Privacy Scanner removes title, author, subject, keywords, creator and producer app fields, and creation and modification dates that pdf-lib can see; embedded file attachments are out of scope in the current version.",
      },
    ],
    related: ["encrypt-pdf", "redact-pdf", "remove-password"],
  },
  {
    slug: "pdf-to-zip",
    name: "PDF to ZIP",
    tagline: "Save every page as a JPG or PNG inside a zip",
    description:
      "Render each PDF page to a JPG or PNG and download them as one zip file. Same page limit as the other render tools. Processing stays in the browser.",
    icon: "🗜️",
    category: "convert",
    howTo: [
      "Upload your PDF.",
      "Choose JPG or PNG, and a DPI.",
      "Click Create ZIP.",
      "Download pages.zip.",
    ],
    faq: [
      {
        q: "How is this different from PDF to JPG?",
        a: "OfflinePDF's PDF to ZIP tool always packages the pages into one zip, including a single-page PDF. PDF to JPG downloads a lone image when the PDF has one page.",
      },
      {
        q: "Is there a page limit?",
        a: "OfflinePDF's PDF to ZIP tool uses the same page cap as the other render tools (750 pages) and a 150 MB file cap, because each page is drawn to a canvas.",
      },
    ],
    related: ["pdf-to-jpg", "images-to-pdf", "split-pdf"],
  },
  {
    slug: "markdown-to-pdf",
    name: "Markdown to PDF",
    tagline: "Turn a README-style Markdown file into a PDF",
    description:
      "Upload a .md file. Headings, lists, tables, and code blocks are rendered in the browser, then you save the print preview as a PDF. Code and tables wrap instead of running off the page.",
    icon: "Ⓜ️",
    category: "convert",
    howTo: [
      "Upload a .md file.",
      "Click Convert to PDF.",
      "Check the preview, especially code blocks and tables.",
      "Click Save as PDF and choose Save as PDF in the print dialog.",
    ],
    faq: [
      {
        q: "Will a long code line run off the page?",
        a: "OfflinePDF's Markdown to PDF tool wraps code blocks and table cells so they stay within the page width. Very wide tables are squeezed, not given a giant page.",
      },
      {
        q: "Is raw HTML in the Markdown executed?",
        a: "OfflinePDF's Markdown to PDF tool escapes raw HTML in the file, then sanitizes the result before preview. It is not a way to run scripts.",
      },
    ],
    related: ["text-to-pdf", "html-to-pdf", "create-pdf"],
  },
  {
    slug: "text-to-pdf",
    name: "Text to PDF",
    tagline: "Turn a plain .txt file into a paginated PDF",
    description:
      "Upload a .txt file. Its line breaks and spacing are preserved exactly, wrapped to the page width, then you save the print preview as a PDF. No formatting is added or guessed.",
    icon: "📄",
    category: "convert",
    howTo: [
      "Upload a .txt file.",
      "Click Convert to PDF.",
      "Check the preview.",
      "Click Save as PDF and choose Save as PDF in the print dialog.",
    ],
    faq: [
      {
        q: "Does it preserve line breaks and spacing?",
        a: "OfflinePDF's Text to PDF tool keeps the original line breaks and spacing exactly, wrapping only when a line is too wide for the page.",
      },
      {
        q: "Will it add headings or formatting?",
        a: "No. OfflinePDF's Text to PDF tool renders the file as plain monospaced text; it does not guess at headings, bold, or lists the way the Markdown to PDF tool does.",
      },
    ],
    related: ["markdown-to-pdf", "html-to-pdf", "create-pdf"],
  },
  {
    slug: "html-to-pdf",
    name: "HTML to PDF",
    tagline: "Print pasted or uploaded HTML to a PDF",
    description:
      "Paste HTML or upload an .html file. It is sanitized in your browser, shown in a locked-down preview, and saved through the print dialog. Scripts and remote images are removed.",
    icon: "🌐",
    category: "convert",
    howTo: [
      "Paste HTML into the box, or upload an .html file.",
      "Click Convert to PDF.",
      "Review the preview.",
      "Click Save as PDF and choose Save as PDF in the print dialog.",
    ],
    faq: [
      {
        q: "Can the HTML run scripts?",
        a: "OfflinePDF's HTML to PDF tool strips scripts, event handlers, and javascript: links, and the preview cannot run scripts. Remote images are removed so the preview does not contact other sites.",
      },
      {
        q: "Where is the file saved?",
        a: "OfflinePDF's HTML to PDF tool uses your browser's print dialog. Choose Save as PDF as the destination. Nothing is uploaded.",
      },
    ],
    related: ["markdown-to-pdf", "text-to-pdf", "create-pdf"],
  },
  {
    slug: "csv-to-pdf",
    name: "CSV to PDF",
    tagline: "Turn a spreadsheet export into a paginated table",
    description:
      "Upload a CSV. The first row becomes the header, and rows continue onto new A4 pages instead of one endless page. Header text is bold and cells have borders.",
    icon: "📊",
    category: "convert",
    howTo: [
      "Upload a .csv file.",
      "Click Convert to PDF.",
      "Download the paginated table.",
    ],
    faq: [
      {
        q: "What happens with thousands of rows?",
        a: "OfflinePDF's CSV to PDF tool paginates across A4 pages and repeats the header. Files over 20,000 rows or 40 columns are rejected so the tab does not lock up.",
      },
      {
        q: "Are quotes and commas handled?",
        a: "OfflinePDF's CSV to PDF tool treats a quoted field as one cell, including commas and doubled quotes inside the quotes.",
      },
    ],
    related: ["excel-to-pdf", "create-pdf", "merge-pdf"],
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    tagline: "Export the first sheet of an Excel file",
    description:
      "Upload .xlsx or .xls. Only the first sheet is exported, as a bordered table with a bold header row. Other sheets are listed in the title so you know they were skipped. Merged cells keep their value in the top-left cell.",
    icon: "📗",
    category: "convert",
    howTo: [
      "Upload an .xlsx or .xls file.",
      "Click Convert to PDF.",
      "Download the PDF of the first sheet.",
    ],
    faq: [
      {
        q: "Are all sheets included?",
        a: "OfflinePDF's Excel to PDF tool exports the first sheet only. If the workbook has more sheets, the PDF title says so. Move the sheet you want to the front, or save that sheet as CSV and use CSV to PDF.",
      },
      {
        q: "Do colors, fonts, and merged cells survive?",
        a: "OfflinePDF's Excel to PDF tool keeps a bold header row and cell borders. It does not copy Excel fonts, colors, or merged-cell spans. A merged value shows in the top-left cell only.",
      },
    ],
    related: ["csv-to-pdf", "pdf-to-excel", "create-pdf"],
  },
  {
    slug: "compare-pdfs",
    name: "Compare PDFs",
    tagline: "See two PDFs side by side, page by page",
    description:
      "Render both PDFs and scroll them together. Optionally mark pixels that differ in red. This is a visual diff, not an AI review of the wording.",
    icon: "⚖️",
    category: "edit",
    howTo: [
      "Upload the first PDF, then the second.",
      "Turn on highlight if you want changed pixels in red.",
      "Click Compare PDFs.",
      "Scroll the paired pages. Download the zip if you want the images.",
    ],
    faq: [
      {
        q: "Does this use AI?",
        a: "OfflinePDF's Compare PDFs tool does not use AI. It draws both pages and, if you ask, paints pixels that differ. It will not summarize what changed in words.",
      },
      {
        q: "How many pages can I compare?",
        a: "OfflinePDF's Compare PDFs tool compares up to 100 pages and uses the heavy file-size cap, because every page is rendered to an image.",
      },
    ],
    related: ["redact-pdf", "extract-text", "privacy-scanner"],
  },
  {
    slug: "repair-pdf",
    name: "Repair PDF",
    tagline: "Rebuild a damaged PDF, or salvage what still opens",
    description:
      "Tries a clean rebuild, then a looser parse that skips broken objects, then a structural rebuild. If only part of the file can be saved, the download is labeled partially recovered.",
    icon: "🛠️",
    category: "edit",
    howTo: [
      "Upload the PDF that will not open.",
      "Click Repair PDF.",
      "Read the result line: rebuilt, or partially recovered.",
      "Download and check the pages.",
    ],
    faq: [
      {
        q: "Will every broken PDF come back whole?",
        a: "No. OfflinePDF's Repair PDF tool says rebuilt when the file parsed cleanly, and partially recovered when damaged objects were skipped. Some files are too damaged to recover at all.",
      },
      {
        q: "Is a password-protected PDF 'damaged'?",
        a: "OfflinePDF's Repair PDF tool does not unlock files. Remove the password with Remove Password first if you know it.",
      },
    ],
    related: ["compress-pdf", "merge-pdf", "remove-password"],
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    tagline: "Rebuild the text of a PDF as a .docx",
    description:
      "Pull text and a rough layout from each page and save a Word file. Headings are guessed from font size. Fidelity is good, not perfect. Scanned pages need OCR first.",
    icon: "📘",
    category: "convert",
    howTo: [
      "Upload a PDF that has real text (not a scan).",
      "Click Convert to Word.",
      "Download the .docx and open it in Word or another editor.",
    ],
    faq: [
      {
        q: "Will it look exactly like the PDF?",
        a: "OfflinePDF's PDF to Word tool keeps paragraphs and approximates headings from font size. Columns, exact spacing, and complex layout will not match. Fidelity is good, not perfect.",
      },
      {
        q: "What about a scanned PDF?",
        a: "OfflinePDF's PDF to Word tool needs a text layer. If the PDF is a scan, run OCR PDF first, then convert.",
      },
    ],
    related: ["word-to-pdf", "extract-text", "ocr-pdf"],
  },
  {
    slug: "create-pdf",
    name: "Create PDF",
    tagline: "Write a short document and save it as a PDF",
    description:
      "A small editor for bold, italic, headings, and lists. It is not a full word processor. When you are done, the same print-to-PDF path as HTML to PDF saves the file.",
    icon: "✍️",
    category: "convert",
    howTo: [
      "Type in the editor. Use the buttons for bold, italic, a heading, or a list.",
      "Click Create PDF.",
      "Click Save as PDF and choose Save as PDF in the print dialog.",
    ],
    faq: [
      {
        q: "Is this a replacement for Google Docs?",
        a: "No. OfflinePDF's Create PDF tool is for a short note or letter: bold, italic, headings, and lists. For a long document, write it elsewhere and use Word to PDF or Markdown to PDF.",
      },
      {
        q: "Does pasted text keep its formatting?",
        a: "Paste comes in as plain text so a copied page cannot run code in the editor. Apply bold, italic, headings, and lists with the buttons.",
      },
    ],
    related: ["html-to-pdf", "markdown-to-pdf", "word-to-pdf"],
  },
  {
    slug: "pdf-to-epub",
    name: "PDF to EPUB",
    tagline: "Wrap a PDF's text in an EPUB ebook",
    description:
      "Extract the text of each page and pack a minimal EPUB (XHTML plus a manifest). Layout from the PDF is not preserved. Scanned PDFs are refused — run OCR first.",
    icon: "📚",
    category: "convert",
    howTo: [
      "Upload a text-based PDF.",
      "Click Convert to EPUB.",
      "Download book.epub and open it in an ebook reader.",
    ],
    faq: [
      {
        q: "Why is my EPUB empty or refused?",
        a: "OfflinePDF's PDF to EPUB tool refuses image-only PDFs, the same way Extract Text does. Run OCR PDF first so there is text to wrap.",
      },
      {
        q: "Will chapters and images match the PDF?",
        a: "OfflinePDF's PDF to EPUB tool writes one section per page of extracted text. It does not rebuild columns, images, or the original line layout.",
      },
    ],
    related: ["ebook-to-pdf", "extract-text", "ocr-pdf"],
  },
  {
    slug: "powerpoint-to-pdf",
    name: "PowerPoint to PDF",
    tagline: "Convert a .pptx deck to PDF in your browser",
    description:
      "Upload a .pptx file. Slide text and images are kept and laid out one slide per page; exact positioning is approximate and animations, charts, and some image types are left out.",
    icon: "📙",
    category: "convert",
    howTo: [
      "Upload a .pptx file.",
      "Click Convert to PDF and check the preview.",
      "Click Save as PDF and choose Save as PDF in the print dialog.",
    ],
    faq: [
      {
        q: "Will it look like PowerPoint?",
        a: "OfflinePDF's PowerPoint to PDF tool keeps slide text and PNG, JPG, GIF, and WebP images, placed from each shape's position. Exact positioning, theme fonts, colors, charts, SmartArt, and animations are not reproduced, so complex slides will differ.",
      },
      {
        q: "What about .ppt files?",
        a: "OfflinePDF's PowerPoint to PDF tool supports only .pptx. Save an older .ppt file as .pptx in PowerPoint first.",
      },
    ],
    related: ["word-to-pdf", "pdf-to-powerpoint", "merge-pdf"],
  },
  {
    slug: "pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    tagline: "Turn each PDF page into a slide image",
    description:
      "Each PDF page becomes one full-bleed picture on a slide. The result is image-based: the text on the slides is not editable.",
    icon: "📽️",
    category: "convert",
    howTo: [
      "Upload your PDF (up to 200 pages).",
      "Click Convert to PowerPoint.",
      "Download slides.pptx.",
    ],
    faq: [
      {
        q: "Can I edit the text on the slides?",
        a: "No. OfflinePDF's PDF to PowerPoint tool places each page as a picture, so the slides look right but the text is not editable. For editable text, use PDF to Word.",
      },
      {
        q: "Is there a page limit?",
        a: "OfflinePDF's PDF to PowerPoint tool converts up to 200 pages and uses the heavy 150 MB file cap, because every page is rendered and embedded as an image.",
      },
    ],
    related: ["powerpoint-to-pdf", "pdf-to-word", "pdf-to-jpg"],
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    tagline: "Best-effort tables from a PDF into .xlsx",
    description:
      "Reads text positions and guesses rows and columns, one sheet per page. Works best on clean, grid-like tables. Best effort: merged cells, borders, and messy layouts will need checking.",
    icon: "📈",
    category: "convert",
    howTo: [
      "Upload a text-based PDF with a table.",
      "Click Convert to Excel.",
      "Download tables.xlsx and check the columns.",
    ],
    faq: [
      {
        q: "How accurate is the table detection?",
        a: "OfflinePDF's PDF to Excel tool is best effort. It groups text by line and aligns columns from x positions, which works for clean grids. Wrapped cells, merged cells, and columns that do not line up can land in the wrong place.",
      },
      {
        q: "What about scanned PDFs?",
        a: "OfflinePDF's PDF to Excel tool needs a text layer. If the PDF is a scan, run OCR PDF first.",
      },
    ],
    related: ["excel-to-pdf", "extract-text", "ocr-pdf"],
  },
  {
    slug: "pdf-to-html",
    name: "PDF to HTML",
    tagline: "Get real, selectable text in a single HTML page",
    description:
      "Each page becomes a positioned layer of actual text, so you can select, search, and copy it. Images and vector graphics are not included, and the file contains no scripts.",
    icon: "🧾",
    category: "convert",
    howTo: [
      "Upload a text-based PDF.",
      "Click Convert to HTML.",
      "Preview, then download document.html.",
    ],
    faq: [
      {
        q: "Is the text selectable?",
        a: "Yes. OfflinePDF's PDF to HTML tool writes the PDF's text as real HTML text at each position, not as a picture. Images and vector drawings from the PDF are not included.",
      },
      {
        q: "Is the HTML file safe to open?",
        a: "OfflinePDF's PDF to HTML tool escapes all text and adds a content security policy that forbids scripts and network requests inside the file.",
      },
    ],
    related: ["extract-text", "pdf-to-word", "html-to-pdf"],
  },
  {
    slug: "ebook-to-pdf",
    name: "eBook to PDF",
    tagline: "Convert an EPUB to PDF (EPUB only)",
    description:
      "Upload a DRM-free .epub. Chapters are laid out in reading order with their images, then saved through the print dialog. Only EPUB is supported — not MOBI or AZW3.",
    icon: "📖",
    category: "convert",
    howTo: [
      "Upload a DRM-free .epub file.",
      "Click Convert to PDF and check the preview.",
      "Click Save as PDF and choose Save as PDF in the print dialog.",
    ],
    faq: [
      {
        q: "Does this support MOBI or AZW3?",
        a: "No. OfflinePDF's eBook to PDF tool supports EPUB only. MOBI and AZW3 are Amazon formats that cannot be read reliably in the browser; convert them to EPUB first, for example with a desktop tool such as Calibre.",
      },
      {
        q: "Why was my EPUB refused?",
        a: "OfflinePDF's eBook to PDF tool refuses DRM-protected EPUBs rather than trying to break the protection. Use a copy you have the right to convert that has no DRM.",
      },
    ],
    related: ["pdf-to-epub", "html-to-pdf", "word-to-pdf"],
  },
  {
    slug: "fingerprint-pdf",
    name: "Fingerprint PDF",
    tagline: "Stamp each copy with a hidden ID to trace leaks",
    description:
      "Adds a unique ID to the PDF's metadata and as near-invisible text on every page. It is a deterrent so a leaked copy can be matched to who got it — not forensic-grade tracking.",
    icon: "🧬",
    category: "security",
    howTo: [
      "Upload the PDF.",
      "Optionally name the recipient, then click Add fingerprint.",
      "Download the copy and write down the ID shown.",
    ],
    faq: [
      {
        q: "How strong is this?",
        a: "OfflinePDF's Fingerprint PDF tool is a deterrent. The ID sits in the metadata and as near-invisible text, so Extract Text can read it. Printing to a new PDF, flattening, screenshots, or stripping metadata with the Privacy Scanner can remove it.",
      },
      {
        q: "Where is the ID stored?",
        a: "OfflinePDF's Fingerprint PDF tool shows the ID on screen once and does not store it anywhere. Write it down next to the recipient's name — nothing is saved on a server.",
      },
    ],
    related: ["add-watermark", "privacy-scanner", "flatten-pdf"],
  },
  {
    slug: "pos-billing",
    name: "POS Billing",
    tagline: "Quick receipts with simple GST, as a PDF",
    description:
      "Keep a small product list, build a cart, and print a receipt as a PDF in A4 or thermal 58/80 mm width. GST maths is simplified: this is a receipt tool, not a GST invoice generator.",
    icon: "🧾",
    category: "more",
    howTo: [
      "Add products with a price and GST %.",
      "Tap products to build the cart.",
      "Choose receipt width and tax mode, then click Make receipt.",
    ],
    faq: [
      {
        q: "Is this a GST invoice?",
        a: "No. OfflinePDF's POS Billing tool prints a simple receipt. It splits GST into CGST/SGST (or IGST) per rate, but has no HSN codes, GSTIN checks, cess, or invoice numbering rules, so it is not a compliance document.",
      },
      {
        q: "Where is my product list stored?",
        a: "OfflinePDF's POS Billing tool keeps the product list in your browser's local storage. It is never sent anywhere, and clearing site data erases it.",
      },
    ],
    related: ["csv-to-pdf", "create-pdf", "images-to-pdf"],
  },
  {
    slug: "scan-to-pdf",
    name: "Scan to PDF",
    tagline: "Photograph pages with your camera and make a PDF",
    description:
      "Use your phone or webcam to capture pages, auto-crop the paper edges, and save one PDF. Photos never leave the device. If the camera is blocked, you can add photos from your gallery instead.",
    icon: "📷",
    category: "more",
    howTo: [
      "Click Start camera and allow access.",
      "Capture each page. Auto-crop trims around the paper.",
      "Click Create PDF and download.",
    ],
    faq: [
      {
        q: "What if I block the camera?",
        a: "OfflinePDF's Scan to PDF tool shows what happened and offers an option to add photos from your device instead. Nothing is uploaded either way.",
      },
      {
        q: "Does it straighten tilted pages?",
        a: "No. OfflinePDF's Scan to PDF tool crops to the paper edges but does not correct perspective or rotation. Hold the phone square to the page.",
      },
    ],
    related: ["images-to-pdf", "ocr-pdf", "compress-pdf"],
  },
  {
    slug: "p2p-share",
    name: "P2P Share",
    tagline: "Send a file straight to another browser",
    description:
      "Create a link or QR code; the other person opens it and the file goes directly browser to browser with no server storage. A free public service helps the two browsers find each other and sees their IP addresses, never the file.",
    icon: "🔁",
    category: "more",
    howTo: [
      "Choose a file and click Create link.",
      "Send the link or show the QR code. Keep this tab open.",
      "When they open it, the transfer starts. They download the file at the end.",
    ],
    faq: [
      {
        q: "Does anything leave my device?",
        a: "The file itself goes directly to the other browser and is never stored on a server. To connect, OfflinePDF's P2P Share tool contacts the public PeerJS service and Google's public STUN servers, which can see IP addresses and a random room ID — so this is the one tool where the page does make outside connections.",
      },
      {
        q: "Why did the transfer stop?",
        a: "OfflinePDF's P2P Share tool shows a Connection lost message if the link drops. Both people must keep their tabs open, and some strict networks block direct connections because no relay server is used.",
      },
    ],
    related: ["whiteboard", "encrypt-pdf", "compress-pdf"],
  },
  {
    slug: "whiteboard",
    name: "Collaborative Whiteboard",
    tagline: "Draw together in a shared board, peer to peer",
    description:
      "Start a board and share the link. Strokes travel directly between browsers; nothing is stored on a server. A free public service helps browsers find each other and sees IP addresses, never your drawing.",
    icon: "🖍️",
    category: "more",
    howTo: [
      "Click Start a shared whiteboard and send the link or QR code.",
      "Draw. Everyone with the link sees strokes live.",
      "Click Download PNG to keep a copy before closing the tab.",
    ],
    faq: [
      {
        q: "Is my drawing stored anywhere?",
        a: "No. OfflinePDF's Whiteboard sends strokes directly between browsers and keeps nothing on a server. Closing the host's tab ends the board, so download the PNG first.",
      },
      {
        q: "Does anything leave my device?",
        a: "To find each other, OfflinePDF's Whiteboard contacts the public PeerJS service and Google's public STUN servers, which can see IP addresses and a random room ID. The drawing itself is sent only to the people with the link.",
      },
    ],
    related: ["p2p-share", "create-pdf", "images-to-pdf"],
  },
  {
    slug: "edit-pdf-text",
    name: "Edit PDF Text",
    tagline: "Change text on a page by covering and redrawing it",
    description:
      "Click text, retype it, and save. It covers the old text with a white box and draws the new text on top — an approximation: fonts will not match exactly, and the old text stays in the file underneath.",
    icon: "✏️",
    category: "edit",
    howTo: [
      "Upload a text-based PDF.",
      "Click a line of text on the page and retype it.",
      "Click Save PDF. Use Redact PDF if the old text must be gone for real.",
    ],
    faq: [
      {
        q: "Is the original text really replaced?",
        a: "No. OfflinePDF's Edit PDF Text tool draws a white box over the old text and writes the new text on top. The original text is still inside the file, so Extract Text can still find it. To remove text permanently, use Redact PDF.",
      },
      {
        q: "Will the font match?",
        a: "Not exactly. OfflinePDF's Edit PDF Text tool redraws with a standard serif, sans-serif, or monospace font at the original size. Exact font and spacing are not guaranteed, and only Latin letters are supported for new text.",
      },
    ],
    related: ["redact-pdf", "extract-text", "add-watermark"],
  },
  {
    slug: "pdf-to-audio",
    name: "PDF to Audio",
    tagline: "Listen to a PDF read aloud in your browser",
    description:
      "Extracts the text and reads it with a voice installed on your device. Listening only: there is no audio file download, because browsers do not reliably allow recording speech synthesis.",
    icon: "🔊",
    category: "convert",
    howTo: [
      "Upload a text-based PDF.",
      "Click Prepare, then choose a voice and speed.",
      "Press Play. Pause or stop any time.",
    ],
    faq: [
      {
        q: "Can I download the audio?",
        a: "No. OfflinePDF's PDF to Audio tool plays speech live only. Browsers do not provide a dependable way to capture speech synthesis as an audio file, so a download would work in some browsers and silently fail in others.",
      },
      {
        q: "Is my text sent to a speech service?",
        a: "OfflinePDF's PDF to Audio tool lists only voices stored on your device. Some browsers also offer online voices that send text to a cloud service; this tool hides them to keep your document local.",
      },
    ],
    related: ["extract-text", "ocr-pdf", "pdf-to-epub"],
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const TOOL_CATEGORIES = [
  { id: "essentials", label: "Essentials" },
  { id: "edit", label: "Edit & Organize" },
  { id: "security", label: "Security" },
  { id: "convert", label: "Convert" },
  { id: "more", label: "Capture, Share & Create" },
] as const;
