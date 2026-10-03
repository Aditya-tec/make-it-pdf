import { PDFDocument } from "pdf-lib";

/** Load a PDFDocument from bytes, throwing a clear error for encrypted or corrupt PDFs. */
export async function loadPdf(bytes: Uint8Array | ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: false });
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    if (/is encrypted/i.test(message)) {
      throw new Error(
        "This PDF is password-protected. Remove the password before using this function."
      );
    }
    throw new Error(`Could not open PDF: ${message}`);
  }
}
