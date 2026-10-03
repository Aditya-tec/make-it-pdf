import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
export const SCANNED_PDF_MESSAGE =
  "No text found. This looks like a scanned PDF. Open the OCR PDF tool to make it searchable, then extract text.";

export async function extractPageTexts(
  data: ArrayBuffer,
  onProgress: (p: number, m?: string) => void
): Promise<string[]> {
  onProgress(10, "Loading PDF…");
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const total = pdf.numPages;
  const parts: string[] = [];
  let hasText = false;
  for (let i = 1; i <= total; i++) {
    onProgress(10 + Math.round((i / total) * 80), `Extracting page ${i}/${total}…`);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => (item.str as string) || "")
      .join(" ")
      .trim();
    if (pageText) hasText = true;
    parts.push(pageText);
  }
  if (!hasText) throw new Error(SCANNED_PDF_MESSAGE);
  return parts;
}

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const parts = await extractPageTexts(files[0], onProgress);
  onProgress(95, "Building text file…");
  const text = parts.map((t, i) => `--- Page ${i + 1} ---\n${t}`).join("\n\n");
  onProgress(100);
  return [{ name: "extracted.txt", bytes: new TextEncoder().encode(text) }];
}
