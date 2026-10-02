import { PDFDocument, PDFName } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Loading…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());

  try {
    const form = src.getForm();
    onProgress(40, "Flattening form fields…");
    form.flatten();
  } catch {
    // no AcroForm
  }

  onProgress(70, "Removing annotations…");
  const Annots = PDFName.of("Annots");
  for (const page of src.getPages()) {
    try {
      if (page.node.has(Annots)) page.node.delete(Annots);
    } catch {
      /* ok */
    }
  }

  onProgress(95, "Saving…");
  const bytes = await src.save();
  onProgress(100);
  return [{ name: "flattened.pdf", bytes }];
}
