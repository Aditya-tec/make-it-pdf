import { z } from "zod";

// Shared field schemas. Every tool takes at least an inputPath; most take an outputPath.
export const inputPath = z.string().describe("Absolute or relative path to the source PDF file on disk.");
export const inputPathCsv = z.string().describe("Absolute or relative path to the source CSV file on disk.");
export const outputPath = z.string().describe("Absolute or relative path where the resulting PDF should be written. Parent directories are created automatically.");

export const mergeSchema = {
  inputPaths: z.array(z.string()).min(2).describe("Paths to two or more PDF files, in the order they should be merged."),
  outputPath,
};

export const splitSchema = {
  inputPath,
  outputPath: z.string().describe(
    "Path to write the result to. If the split produces multiple files they are bundled into a single .zip — give this a .zip path in that case; a single range produces one .pdf."
  ),
  ranges: z.string().optional().describe('Page ranges like "1-3, 5, 7-10" (1-indexed). Omit to split into one file per page.'),
};

export const rotateSchema = {
  inputPath,
  outputPath,
  angle: z.union([z.literal(90), z.literal(180), z.literal(270)]).default(90).describe("Clockwise rotation angle to apply to every page."),
};

export const organizeSchema = {
  inputPath,
  outputPath,
  ops: z
    .array(
      z.object({
        originalIndex: z.number().int().min(0).describe("0-based index of the page in the source PDF."),
        rotation: z.number().int().describe("Additional rotation to apply on top of the page's existing rotation: 0, 90, 180, or 270."),
      })
    )
    .min(1)
    .describe(
      "Explicit allowlist of pages to keep, in output order. Any original page not listed is dropped. " +
        "To reorder/rotate without deleting anything, every original page index must appear exactly once."
    ),
};

export const watermarkSchema = {
  inputPath,
  outputPath,
  text: z.string().optional().describe('Watermark text. Default: "CONFIDENTIAL". Ignored if imagePath is set.'),
  imagePath: z.string().optional().describe("Path to a JPEG or PNG file to stamp instead of text."),
  opacity: z.number().min(0).max(1).optional().describe("Opacity from 0 to 1. Default: 0.3."),
  rotation: z.number().optional().describe("Rotation in degrees. Default: 45."),
  fontSize: z.number().optional().describe("Font size for text watermarks. Default: 48."),
};

export const pageNumbersSchema = {
  inputPath,
  outputPath,
  format: z.enum(["n", "n/N", "Page n"]).optional().describe('"n" -> "3", "n/N" -> "3/10", "Page n" -> "Page 3". Default: "n".'),
  start: z.number().int().optional().describe("Number to start counting from. Default: 1."),
  skipFirst: z.boolean().optional().describe("Skip numbering the first page (e.g. a cover page). Default: false."),
  position: z.enum(["bottom-center", "bottom-right", "bottom-left", "top-center"]).optional().describe("Where the number sits on the page. Default: bottom-center."),
  fontSize: z.number().optional().describe("Font size, clamped to 8-36. Default: 12."),
};

export const flattenSchema = { inputPath, outputPath };

export const headerFooterSchema = {
  inputPath,
  outputPath,
  header: z.string().optional().describe("Header text, clipped to 120 characters. Omit to draw no header."),
  footer: z.string().optional().describe("Footer text, clipped to 120 characters. Omit to draw no footer."),
  includePageNumber: z.boolean().optional().describe('Draw "n / N" in the bottom-right of every page. Default: false.'),
  includeDate: z.boolean().optional().describe("Draw today's date (yyyy-mm-dd) in the top-right of every page. Default: false."),
  fontSize: z.number().optional().describe("Font size, clamped to 8-18. Default: 10."),
};

export const cropSchema = {
  inputPath,
  outputPath,
  mode: z.enum(["margins", "resize"]).optional().describe('"margins" trims by percentage; "resize" draws each page onto a new target page size. Default: margins.'),
  marginTop: z.number().min(0).max(0.45).optional().describe("Fraction of page height to trim from the top. Only used when mode is margins."),
  marginRight: z.number().min(0).max(0.45).optional().describe("Fraction of page width to trim from the right. Only used when mode is margins."),
  marginBottom: z.number().min(0).max(0.45).optional().describe("Fraction of page height to trim from the bottom. Only used when mode is margins."),
  marginLeft: z.number().min(0).max(0.45).optional().describe("Fraction of page width to trim from the left. Only used when mode is margins."),
  target: z.enum(["a4", "letter", "keep"]).optional().describe('Target page size when mode is resize. "keep" reuses the first page\'s size. Default: a4.'),
  fit: z.enum(["contain", "stretch"]).optional().describe("How to fit content into the target size when mode is resize. Default: contain."),
};

export const fingerprintSchema = {
  inputPath,
  outputPath,
  label: z.string().optional().describe("A human-readable label embedded alongside the ID. ASCII only, clipped to 60 characters."),
  id: z.string().optional().describe("Supply your own ID instead of generating one (must match FP-XXXXXXXX-XXXXXXXXXX). If omitted, a random one is generated."),
};

export const scanMetadataSchema = { inputPath };

export const stripMetadataSchema = { inputPath, outputPath };

export const csvToPdfSchema = {
  inputPath: inputPathCsv,
  outputPath,
  title: z.string().optional().describe("Optional title drawn at the top of every page."),
};

export const extractTextSchema = { inputPath };

export const ocrSchema = {
  inputPath,
  lang: z.literal("eng").optional().describe('OCR language. Only "eng" (English) is bundled with this server.'),
};

export const repairSchema = { inputPath, outputPath };

export const posBillingSchema = {
  outputPath,
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(60).describe("Item name, up to 60 characters."),
        price: z.number().min(0).max(10_000_000).describe("Unit price in rupees."),
        qty: z.number().int().min(1).max(9999).describe("Quantity, a whole number from 1 to 9999."),
        gst: z.number().min(0).max(100).describe("GST percentage for this line, 0-100."),
      })
    )
    .min(1)
    .max(200)
    .describe("Cart line items, 1-200 of them."),
  inclusive: z.boolean().optional().describe("True if `price` already includes GST. Default: false (GST is added on top)."),
  interState: z.boolean().optional().describe("True to show a single IGST line instead of split CGST/SGST. Default: false."),
  width: z.enum(["a4", "80mm", "58mm"]).optional().describe("Receipt paper width. Default: 80mm (thermal printer)."),
  shop: z.string().optional().describe("Shop/business name printed at the top of the receipt."),
  receiptNo: z.string().optional().describe("Receipt number printed under the shop name."),
};
