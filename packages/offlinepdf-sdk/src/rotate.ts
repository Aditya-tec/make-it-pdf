import { degrees } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

export type RotationAngle = 90 | 180 | 270;

/**
 * Rotate every page of a PDF by 90, 180, or 270 degrees. Rotation is additive:
 * a page that is already rotated keeps its existing orientation and gets another turn.
 *
 * @example
 * const rotated = await rotatePdf(file, 90);
 */
export async function rotatePdf(file: Uint8Array, angle: RotationAngle = 90): Promise<Uint8Array> {
  if (![90, 180, 270].includes(angle)) throw new Error("angle must be 90, 180, or 270.");

  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());

  for (const page of src.getPages()) {
    const existing = page.getRotation().angle;
    page.setRotation(degrees((existing + angle) % 360));
  }

  return src.save();
}
