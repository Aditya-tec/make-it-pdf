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
      "Drag in your PDFs, rearrange them in any order, and download a single merged PDF. No upload, no watermark, works offline.",
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
        a: "We recommend keeping total input under 200 MB for smooth in-browser processing.",
      },
      {
        q: "Are my files uploaded anywhere?",
        a: "No. All processing happens in your browser. Your files never leave your device.",
      },
      {
        q: "What if one of my PDFs is password-protected?",
        a: "Remove the password first using our Encrypt/Decrypt tool, then merge.",
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
      "Click 'Compress' — the before/after size appears when done.",
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
        a: "Unlimited — we keep the full history in memory until you close the page.",
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
      "Set a password on your PDF using AES-256 encryption. The file is processed entirely in your browser — we never see your password or your file.",
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
        a: "Yes — open the encrypted PDF in your browser's PDF viewer or any PDF reader and use the 'Save as' option, or use a dedicated decrypt tool.",
      },
      {
        q: "What encryption standard is used?",
        a: "AES-256, the same standard used by banks. It is processed 100% in your browser.",
      },
    ],
    related: ["organize-pages", "add-watermark", "extract-text"],
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
        a: "Your PDF is likely a scanned image. Use the OCR tool (coming soon) to extract text from scanned documents.",
      },
      {
        q: "Is formatting preserved?",
        a: "Basic line breaks and spacing are kept, but complex layouts (columns, tables) may not be perfectly reproduced in plain text.",
      },
    ],
    related: ["word-to-pdf", "compress-pdf", "encrypt-pdf"],
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
