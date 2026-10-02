import { degrees } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const angle = Number(opts.angle ?? 90);
  if (![90, 180, 270].includes(angle)) throw new Error("Angle must be 90, 180, or 270.");

  onProgress(10, "Loading…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());
  const pages = src.getPages();

  for (let i = 0; i < pages.length; i++) {
    const existing = pages[i].getRotation().angle;
    pages[i].setRotation(degrees((existing + angle) % 360)); // additive, never resets
    onProgress(10 + Math.round((i / pages.length) * 80), `Rotating page ${i + 1}…`);
  }

  onProgress(95, "Saving…");
  const bytes = await src.save();
  onProgress(100);
  return [{ name: "rotated.pdf", bytes }];
}
