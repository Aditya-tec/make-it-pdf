export interface Tool {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // emoji or SVG path name
  category: "essentials" | "edit" | "security" | "convert";
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
    related: ["images-to-pdf", "compress-pdf", "split-pdf"],
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
    related: ["pdf-to-jpg", "merge-pdf", "compress-pdf"],
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
    related: ["merge-pdf", "compress-pdf", "extract-text"],
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
    related: ["organize-pages", "encrypt-pdf", "merge-pdf"],
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
    related: ["ocr-pdf", "word-to-pdf", "compress-pdf"],
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
    related: ["extract-text", "pdf-to-jpg", "compress-pdf"],
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
    related: ["flatten-pdf", "privacy-scanner", "encrypt-pdf"],
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
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const TOOL_CATEGORIES = [
  { id: "essentials", label: "Essentials" },
  { id: "edit", label: "Edit & Organize" },
  { id: "security", label: "Security" },
  { id: "convert", label: "Convert" },
] as const;
