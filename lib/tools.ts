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
      "Drag in your PDFs, rearrange them in any order, and download a single merged PDF. No upload, no watermark, no signup.",
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
        a: "Merge allows up to 300 MB per file (600 MB total). Heavier tools like Compress or OCR have lower caps.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: "No. All processing happens in your browser. Your files never leave your device.",
      },
      {
        q: "What if one of my PDFs is password-protected?",
        a: "Remove the password first: open it in a PDF viewer, enter the password, save/print a copy without one, then merge.",
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
        a: "Yes. Type ranges like '1-3, 5, 7-10' in the range input, or click page thumbnails individually.",
      },
      {
        q: "Will I get one file or many?",
        a: "Multiple pages are zipped together automatically. A single-page result is a plain PDF.",
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
        a: "Text-only PDFs have little image data to re-encode, so compression gains are small. We'll always show you the real before/after size.",
      },
      {
        q: "Does compression affect text quality?",
        a: "No. Text and vector content are untouched. Only embedded raster images are re-encoded.",
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
        a: "72 DPI for web preview, 150 DPI for general use, 300 DPI for print. Higher DPI = larger files and more memory.",
      },
      {
        q: "Why is high DPI slow on mobile?",
        a: "Rendering a large PDF page at 300 DPI is memory-intensive. We cap memory and warn you if a page is very large.",
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
        a: "JPG, PNG, WebP, and GIF. Each image becomes one page.",
      },
      {
        q: "Can I mix portrait and landscape images?",
        a: "Yes. Each page is sized to the image by default, so mixed orientations work fine.",
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
        a: "Good fidelity for most documents, but complex layouts with exact spacing may differ slightly. This is a browser limitation, not our design.",
      },
      {
        q: "What about .doc files (older Word format)?",
        a: "Only .docx is supported. Convert your .doc to .docx in Word first.",
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
        a: "Unlimited, we keep the full history in memory until you close the page.",
      },
      {
        q: "Is there a page limit?",
        a: "No hard limit. Very large PDFs (300+ pages) may take a moment to render thumbnails.",
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
        a: "Currently the watermark is applied to all pages. Page-level control is on the roadmap.",
      },
      {
        q: "What image formats work for watermarks?",
        a: "PNG (with transparency) gives the best results. JPG is also supported.",
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
        a: "Yes, use our Remove Password tool with the same password, or open the PDF in a viewer and save/print a copy without one.",
      },
      {
        q: "What encryption standard is used?",
        a: "AES-256. It is processed 100% in your browser.",
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
        a: "Your PDF is likely a scanned image. Use the OCR tool to make it searchable, then extract text.",
      },
      {
        q: "Is formatting preserved?",
        a: "Basic line breaks and spacing are kept, but complex layouts (columns, tables) may not be perfectly reproduced in plain text.",
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
        a: "No. New rotation is added on top of whatever the page already has.",
      },
      {
        q: "Can I rotate single pages?",
        a: "Use Organize Pages for per-page rotate, reorder, and delete.",
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
        a: "Contain keeps aspect ratio and may leave empty margins. Stretch fills the page and may distort the content.",
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
        a: "Yes, set the starting number before applying.",
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
        a: "We draw a semi-transparent white band behind the header/footer so it stays readable on dark or full-bleed pages.",
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
        a: "You'll get a clear error. We never send the password or the file to a server.",
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
        a: "OCR is capped at 75 pages for browser memory. Split larger scans first.",
      },
      {
        q: "Does this upload my file?",
        a: "No. The OCR engine and English language model are served from this site and run on your device.",
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
        a: "Yes, field values are baked into the page appearance, then the interactive fields are removed.",
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
        a: "Yes for redacted pages, they become images with the boxes burned in, so Extract Text cannot recover what was under a box.",
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
        a: "No. This tool re-renders pages as images so colours can be remapped. Use it for reading comfort, not for editable text.",
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
        a: "Title, author, subject, keywords, creator/producer apps, and creation/modification dates that pdf-lib can see. Embedded file attachments are out of scope for this version.",
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
