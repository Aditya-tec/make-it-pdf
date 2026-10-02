import { PDFDocument } from "pdf-lib";

/** Load a PDFDocument from bytes. Throws with a friendly message for encrypted PDFs. */
export async function loadPdf(bytes: ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("encrypt") || msg.toLowerCase().includes("password")) {
      throw new Error(
        "This PDF is password-protected. Remove the password with the Encrypt PDF tool first."
      );
    }
    throw new Error(`Could not open PDF: ${msg}`);
  }
}

/** Return true if the buffer starts with the PDF magic bytes. */
export function isPdf(bytes: ArrayBuffer): boolean {
  const view = new Uint8Array(bytes, 0, 5);
  return (
    view[0] === 0x25 && // %
    view[1] === 0x50 && // P
    view[2] === 0x44 && // D
    view[3] === 0x46 && // F
    view[4] === 0x2d    // -
  );
}

/** Format bytes as a human-readable string (e.g. "1.2 MB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
