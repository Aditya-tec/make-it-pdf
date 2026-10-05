const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(20, "Reading text…");
  const src = new TextDecoder().decode(files[0]).replace(/^﻿/, "");
  if (!src.trim()) throw new Error("The text file is empty.");
  const html = `<pre>${esc(src)}</pre>`;
  onProgress(100);
  return [{ name: "converted.html", bytes: new TextEncoder().encode(html) }];
}
