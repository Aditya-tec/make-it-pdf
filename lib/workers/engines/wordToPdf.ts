// ponytail: mammoth → HTML, then html2canvas-style via OffscreenCanvas isn't feasible in a worker.
// We instead return the HTML and let the main-thread print path handle PDF generation.
// The engine returns one "file" with a special name ending in .html; the UI detects this
// and triggers window.print() with a hidden iframe, which the browser converts to PDF.
// Ceiling: complex multi-column layouts may not be pixel-perfect. Known limitation, labeled in UI.
import mammoth from "mammoth";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(20, "Parsing Word document…");
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: files[0] });
  onProgress(80, "Converting…");
  const styled = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Georgia, serif; font-size: 12pt; margin: 2.5cm; line-height: 1.6; color: #000; }
  h1,h2,h3,h4 { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; }
  img { max-width: 100%; }
  @page { margin: 2.5cm; }
  @media print { body { margin: 0; } }
</style></head><body>${html}</body></html>`;
  const encoder = new TextEncoder();
  onProgress(100);
  return [{ name: "converted.word-to-pdf.html", bytes: encoder.encode(styled) }];
}
