import { flattenPdf } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Loading…");
  const bytes = await flattenPdf(new Uint8Array(files[0]));
  onProgress(100);
  return [{ name: "flattened.pdf", bytes }];
}
