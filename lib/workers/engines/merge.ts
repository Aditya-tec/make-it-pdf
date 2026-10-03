import { mergePdfs } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, `Merging ${files.length} file${files.length === 1 ? "" : "s"}…`);
  const bytes = await mergePdfs(files.map((f) => new Uint8Array(f)));
  onProgress(100);
  return [{ name: "merged.pdf", bytes }];
}
