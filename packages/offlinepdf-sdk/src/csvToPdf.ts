import { parseCsv } from "./internal/csv";
import { tableToPdf } from "./internal/tableToPdf";

export interface CsvToPdfOptions {
  /** Optional title drawn at the top of every page. */
  title?: string;
}

/**
 * Convert a CSV file into a paginated PDF table. The first row becomes a bold header repeated
 * on every page; remaining rows continue onto new A4 pages instead of one endless page. Cells
 * are truncated with "…" rather than overflowing their column. Supports up to 20,000 rows and
 * 40 columns.
 *
 * @example
 * const out = await csvToPdf(file, { title: "Q3 Export" });
 */
export async function csvToPdf(file: Uint8Array, options: CsvToPdfOptions = {}): Promise<Uint8Array> {
  const text = new TextDecoder().decode(file).replace(/^﻿/, "");
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("No rows found in this CSV.");
  return tableToPdf(rows, options.title);
}
