import { PDFDict, PDFName, PDFString, rgb, StandardFonts } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { ascii } from "./tableToPdf";

// A deterrent, not forensics: the ID is stamped in metadata and as near-invisible text on every page.
// Any re-render (print to PDF, "flatten", screenshot) or the Privacy Scanner can remove it.
export const FINGERPRINT_RE = /^FP-[0-9A-F]{8}-[0-9A-Z]{4,10}$/;

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const id = String(opts.id ?? "");
  if (!FINGERPRINT_RE.test(id)) throw new Error("Invalid fingerprint ID.");
  const label = ascii(String(opts.label ?? "")).replace(/\s+/g, " ").trim().slice(0, 60);
  const mark = label ? `${id} ${label}` : id;

  onProgress(20, "Loading PDF…");
  const doc = await loadPdf(files[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  onProgress(50, "Stamping pages…");
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
  onProgress(100);
  return [{ name: "fingerprinted.pdf", bytes }];
}
