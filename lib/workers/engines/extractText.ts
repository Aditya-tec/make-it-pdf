import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Loading PDF…");
  const loadingTask = pdfjsLib.getDocument({ data: files[0] });
  const pdf = await loadingTask.promise;
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
    parts.push(`--- Page ${i} ---\n${pageText}`);
  }

  if (!hasText) {
    throw new Error(
      "No text found. This looks like a scanned PDF. Open the OCR PDF tool to make it searchable, then extract text."
    );
  }

  onProgress(95, "Building text file…");
  const text = parts.join("\n\n");
  const bytes = new TextEncoder().encode(text);
  onProgress(100);
  return [{ name: "extracted.txt", bytes }];
}
