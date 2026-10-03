// Returns the HTML fragment for the main thread to sanitize and print.
// Do not sanitize here: DOMPurify needs a DOM. HtmlPrintPreview is the only renderer.
export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(30, "Reading HTML…");
  const html = new TextDecoder().decode(files[0]).replace(/^\uFEFF/, "");
  if (!html.trim()) throw new Error("The HTML is empty.");
  onProgress(100);
  return [{ name: "converted.html", bytes: new TextEncoder().encode(html) }];
}
