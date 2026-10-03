import { organizePages, type PageOp } from "offlinepdf-sdk";

export type { PageOp };

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const ops = opts.pages as PageOp[];
  if (!ops || ops.length === 0) throw new Error("No page operations provided.");

  onProgress(10, "Rebuilding pages…");
  const bytes = await organizePages(new Uint8Array(files[0]), ops);
  onProgress(100);
  return [{ name: "organized.pdf", bytes }];
}
