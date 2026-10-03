import { addWatermark } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Loading document…");
  const bytes = await addWatermark(new Uint8Array(files[0]), {
    text: opts.text as string | undefined,
    opacity: opts.opacity !== undefined ? Number(opts.opacity) : undefined,
    rotation: opts.rotation !== undefined ? Number(opts.rotation) : undefined,
    fontSize: opts.fontSize !== undefined ? Number(opts.fontSize) : undefined,
    image: opts.imageBytes as Uint8Array | undefined,
  });
  onProgress(100);
  return [{ name: "watermarked.pdf", bytes }];
}
