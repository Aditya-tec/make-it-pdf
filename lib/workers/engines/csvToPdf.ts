import { parseCsv } from "@/lib/pdf/csv";
import { tableToPdf } from "./tableToPdf";

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(10, "Parsing CSV…");
  const text = new TextDecoder().decode(files[0]).replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("No rows found in this CSV.");
  const bytes = await tableToPdf(rows, onProgress);
  return [{ name: "table.pdf", bytes }];
}
