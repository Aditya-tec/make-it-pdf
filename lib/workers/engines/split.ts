import { splitPdf } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Splitting…");
  const outputs = await splitPdf(new Uint8Array(files[0]), {
    ranges: opts.ranges as string | undefined,
  });
  onProgress(100);
  return outputs;
}
