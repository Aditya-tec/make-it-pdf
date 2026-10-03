import {
  addPageNumbers,
  type PageNumberFormat,
  type PageNumberPosition,
} from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Loading…");
  const bytes = await addPageNumbers(new Uint8Array(files[0]), {
    format: opts.format as PageNumberFormat | undefined,
    start: opts.start !== undefined ? Number(opts.start) : undefined,
    skipFirst: Boolean(opts.skipFirst),
    position: opts.position as PageNumberPosition | undefined,
    fontSize: opts.fontSize !== undefined ? Number(opts.fontSize) : undefined,
  });
  onProgress(100);
  return [{ name: "numbered.pdf", bytes }];
}
