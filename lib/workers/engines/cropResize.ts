import { cropPdf, type CropMode, type CropFit, type CropTarget } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const mode = (opts.mode as CropMode | undefined) ?? "margins";
  onProgress(10, "Loading…");
  const bytes = await cropPdf(new Uint8Array(files[0]), {
    mode,
    fit: opts.fit as CropFit | undefined,
    target: opts.target as CropTarget | undefined,
    marginTop: opts.marginTop !== undefined ? Number(opts.marginTop) : undefined,
    marginRight: opts.marginRight !== undefined ? Number(opts.marginRight) : undefined,
    marginBottom: opts.marginBottom !== undefined ? Number(opts.marginBottom) : undefined,
    marginLeft: opts.marginLeft !== undefined ? Number(opts.marginLeft) : undefined,
  });
  onProgress(100);
  return [{ name: mode === "margins" ? "cropped.pdf" : "resized.pdf", bytes }];
}
