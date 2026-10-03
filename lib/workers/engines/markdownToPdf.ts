import { markdownToHtml } from "@/lib/markdown";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(20, "Parsing Markdown…");
  const src = new TextDecoder().decode(files[0]).replace(/^\uFEFF/, "");
  if (!src.trim()) throw new Error("The Markdown file is empty.");
  const html = markdownToHtml(src);
  onProgress(100);
  return [{ name: "converted.html", bytes: new TextEncoder().encode(html) }];
}
