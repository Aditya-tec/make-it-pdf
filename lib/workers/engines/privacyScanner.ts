import { scanPdfMetadata, stripPdfMetadata, type MetadataFinding } from "offlinepdf-sdk";

export type Finding = MetadataFinding;

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const strip = Boolean(opts.strip);
  onProgress(10, "Reading metadata…");
  const file = new Uint8Array(files[0]);

  if (!strip) {
    const { findings, pageCount } = await scanPdfMetadata(file);
    const report = new TextEncoder().encode(JSON.stringify({ findings, pageCount }));
    onProgress(100);
    return [{ name: "scan-report.json", bytes: report }];
  }

  onProgress(50, "Stripping metadata…");
  const { bytes, findings } = await stripPdfMetadata(file);
  onProgress(90, "Saving…");
  const meta = new TextEncoder().encode(JSON.stringify({ findings }));
  onProgress(100);
  return [
    { name: "cleaned.pdf", bytes },
    { name: "removed-metadata.json", bytes: meta },
  ];
}
