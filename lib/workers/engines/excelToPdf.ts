import * as XLSX from "xlsx";
import { tableToPdf } from "./tableToPdf";

// First sheet only. Merged cells keep their value in the origin cell (sheet_to_json).
export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(15, "Reading spreadsheet…");
  const wb = XLSX.read(new Uint8Array(files[0]), { type: "array" });
  const name = wb.SheetNames[0];
  if (!name) throw new Error("This workbook has no sheets.");
  const sheet = wb.Sheets[name];
  const raw = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  const rows = raw.map((r) => (Array.isArray(r) ? r : []).map((c) => String(c ?? "")));
  if (!rows.length) throw new Error(`Sheet "${name}" is empty.`);
  const extra = wb.SheetNames.length > 1 ? ` (first sheet of ${wb.SheetNames.length})` : "";
  const bytes = await tableToPdf(rows, onProgress, name + extra);
  return [{ name: "spreadsheet.pdf", bytes }];
}
