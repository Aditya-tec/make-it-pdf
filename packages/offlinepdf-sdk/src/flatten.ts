import { PDFName } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

/**
 * Flatten interactive form fields into static page content and strip annotations,
 * so filled-in values stay visible but can no longer be edited.
 *
 * @example
 * const out = await flattenPdf(file);
 */
export async function flattenPdf(file: Uint8Array): Promise<Uint8Array> {
  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());

  try {
    src.getForm().flatten();
  } catch {
    // no AcroForm
  }

  const Annots = PDFName.of("Annots");
  for (const page of src.getPages()) {
    try {
      if (page.node.has(Annots)) page.node.delete(Annots);
    } catch {
      /* ok */
    }
  }

  return src.save();
}
