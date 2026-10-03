import { rotatePdf, type RotationAngle } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const angle = Number(opts.angle ?? 90);
  if (![90, 180, 270].includes(angle)) throw new Error("Angle must be 90, 180, or 270.");

  onProgress(10, "Rotating…");
  const bytes = await rotatePdf(new Uint8Array(files[0]), angle as RotationAngle);
  onProgress(100);
  return [{ name: "rotated.pdf", bytes }];
}
