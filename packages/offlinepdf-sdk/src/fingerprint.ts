import { PDFDict, PDFName, PDFString, rgb, StandardFonts } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { ascii } from "./internal/ascii";

// A deterrent, not forensics: the ID is stamped in metadata and as near-invisible text on
// every page. Any re-render (print to PDF, flatten, screenshot) can remove it.
export const FINGERPRINT_ID_PATTERN = /^FP-[0-9A-F]{8}-[0-9A-Z]{4,10}$/;

export interface FingerprintOptions {
  /** A human-readable label embedded alongside the ID. ASCII only; other characters become "?". Clipped to 60 characters. */
  label?: string;
  /**
   * Supply your own ID instead of generating one (must match `FINGERPRINT_ID_PATTERN`,
   * e.g. to reuse the same ID across a batch of files). If omitted, a random one is
   * generated with `generateFingerprintId()`.
   */
  id?: string;
}

export interface FingerprintResult {
  bytes: Uint8Array;
  /**
   * The fingerprint ID stamped into the PDF's metadata and as near-invisible text on
   * every page. This is not recoverable by looking at the file — save it yourself if
   * you need to match a leaked copy back to a recipient.
   */
  id: string;
}

/** Generate a random fingerprint ID in the `FP-XXXXXXXX-XXXXXXXXXX` format. */
export function generateFingerprintId(): string {
  const b = crypto.getRandomValues(new Uint8Array(4));
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `FP-${hex}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Stamp a PDF with a unique ID: a deterrent against leaks, not forensic-grade tracking.
 * The ID sits in the metadata and as near-invisible text on every page, so a leaked copy
 * can be matched back to who received it. Printing to a new PDF, flattening, or a
 * screenshot can remove it.
 *
 * @example
 * const { bytes, id } = await fingerprintPdf(file, { label: "sent to Acme Corp" });
 * console.log("fingerprint ID:", id); // write this down — it isn't stored anywhere
 */
export async function fingerprintPdf(
  file: Uint8Array,
  options: FingerprintOptions = {}
): Promise<FingerprintResult> {
  const id = options.id ?? generateFingerprintId();
  if (!FINGERPRINT_ID_PATTERN.test(id)) throw new Error("Invalid fingerprint ID.");
  const label = ascii(options.label ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
  const mark = label ? `${id} ${label}` : id;

  const doc = await loadPdf(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const style = { size: 3, font, color: rgb(1, 1, 1), opacity: 0.04 };
    page.drawText(mark, { ...style, x: 6, y: 4 });
    page.drawText(mark, { ...style, x: Math.max(6, width - font.widthOfTextAtSize(mark, 3) - 6), y: height - 8 });
  }

  doc.setModificationDate(new Date()); // makes sure an Info dictionary exists
  const info = doc.context.lookup(doc.context.trailerInfo.Info, PDFDict);
  info?.set(PDFName.of("OfflinePDFFingerprint"), PDFString.of(mark));

  const bytes = await doc.save();
  return { bytes, id };
}
