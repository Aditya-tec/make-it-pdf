import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";
import { assertPageCount } from "@/lib/pdf/validate";
import { boxesToRows } from "@/lib/pdf/tableDetect";
import { SCANNED_PDF_MESSAGE } from "./extractText";
import { pageItems } from "./textItems";

const MAX_PAGES = 200;

// Best effort: one sheet per page, columns guessed from x alignment.
export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(8, "Loading PDF…");
  const pdf = await pdfjsLib.getDocument({ data: files[0] }).promise;
  assertPageCount(pdf.numPages);
  if (pdf.numPages > MAX_PAGES) throw new Error(`This PDF has ${pdf.numPages} pages; PDF to Excel supports up to ${MAX_PAGES}.`);

  const wb = XLSX.utils.book_new();
  let any = false;
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(8 + Math.round((i / pdf.numPages) * 85), `Reading page ${i}/${pdf.numPages}…`);
    const rows = boxesToRows(await pageItems(await pdf.getPage(i)));
    if (rows.length) any = true;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows.length ? rows : [[""]]), `Page ${i}`);
  }
  if (!any) throw new Error(SCANNED_PDF_MESSAGE);

  onProgress(96, "Writing workbook…");
  const bytes = new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
  onProgress(100);
  return [{ name: "tables.xlsx", bytes }];
}
