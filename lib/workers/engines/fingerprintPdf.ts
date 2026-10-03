import { fingerprintPdf, FINGERPRINT_ID_PATTERN } from "offlinepdf-sdk";

export const FINGERPRINT_RE = FINGERPRINT_ID_PATTERN;

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(20, "Loading PDF…");
  const { bytes } = await fingerprintPdf(new Uint8Array(files[0]), {
    id: opts.id as string | undefined,
    label: opts.label as string | undefined,
  });
  onProgress(100);
  return [{ name: "fingerprinted.pdf", bytes }];
}
