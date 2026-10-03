import { zipFiles } from "@/lib/pdf/zip";
import { renderPdfImages } from "./pdfToJpg";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const images = await renderPdfImages(files[0], opts, onProgress);
  onProgress(95, "Zipping pages…");
  const zipBytes = await zipFiles(images);
  onProgress(100);
  return [{ name: "pages.zip", bytes: zipBytes }];
}
