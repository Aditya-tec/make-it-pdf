import { addHeaderFooter } from "offlinepdf-sdk";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Loading…");
  const bytes = await addHeaderFooter(new Uint8Array(files[0]), {
    header: opts.header as string | undefined,
    footer: opts.footer as string | undefined,
    includePageNumber: Boolean(opts.includePage),
    includeDate: Boolean(opts.includeDate),
    fontSize: opts.fontSize !== undefined ? Number(opts.fontSize) : undefined,
  });
  onProgress(100);
  return [{ name: "headers-footers.pdf", bytes }];
}
