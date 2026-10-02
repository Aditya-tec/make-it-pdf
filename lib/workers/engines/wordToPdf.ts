// mammoth: .docx -> HTML *fragment*. It is untrusted; the UI sanitizes it (DOMPurify) and shows it in a
// sandboxed iframe, then the browser's print dialog produces the PDF.
// Ceiling: not pixel-perfect (labeled in the UI). A CSS-to-pdf-lib layout pass would be the upgrade path.
import mammoth from "mammoth";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(20, "Parsing Word document…");
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: files[0] });
  onProgress(100);
  return [{ name: "converted.html", bytes: new TextEncoder().encode(html) }];
}
