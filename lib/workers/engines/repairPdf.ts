import { PDFDocument } from "pdf-lib";
import { loadQpdf } from "./qpdfLoad";

async function rewrite(bytes: Uint8Array, lenient: boolean): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: !lenient, ignoreEncryption: false });
  if (doc.getPageCount() < 1) throw new Error("No pages recovered.");
  return doc.save();
}

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const input = new Uint8Array(files[0]);
  onProgress(15, "Re-parsing PDF…");
  try {
    const bytes = await rewrite(input, false);
    onProgress(100);
    return [{ name: "repaired.pdf", bytes }];
  } catch {
    /* try a looser parse */
  }

  onProgress(45, "Skipping damaged objects…");
  try {
    const bytes = await rewrite(input, true);
    onProgress(100);
    return [{ name: "partially-recovered.pdf", bytes }];
  } catch {
    /* fall through to qpdf */
  }

  const isolated = (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true;
  if (!isolated) {
    throw new Error(
      "This PDF is too damaged for a clean rebuild. Structural recovery needs this page in isolated mode — reload and try again. Some files cannot be repaired."
    );
  }

  onProgress(70, "Rebuilding the file structure…");
  try {
    const qpdf = await loadQpdf();
    qpdf.FS.writeFile("/input.pdf", input);
    const code: number = qpdf.callMain([
      "--warning-exit-0",
      "--object-streams=disable",
      "/input.pdf",
      "/output.pdf",
    ]);
    if (code !== 0) throw new Error("qpdf failed");
    const out: Uint8Array = qpdf.FS.readFile("/output.pdf");
    const bytes = await rewrite(out, true);
    onProgress(100);
    return [{ name: "partially-recovered.pdf", bytes }];
  } catch {
    throw new Error("This PDF is too damaged to recover. Some corruption cannot be repaired.");
  }
}
