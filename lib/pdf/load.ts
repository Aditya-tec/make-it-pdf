import { PDFDocument } from "pdf-lib";
import { friendlyError } from "./validate";

/** Load a PDFDocument from bytes. Throws a user-actionable message for encrypted/corrupt PDFs. */
export async function loadPdf(bytes: ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = friendlyError(err);
    // friendlyError passes unknown errors through unchanged; label those
    throw new Error(msg === (err as Error)?.message ? `Could not open PDF: ${msg}` : msg);
  }
}

/** Format bytes as a human-readable string (e.g. "1.2 MB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
