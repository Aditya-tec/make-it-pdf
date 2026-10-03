import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRef } from "pdf-lib";
import { loadPdf } from "./internal/load";
import { assertPageCount } from "./internal/validate";

export interface MetadataFinding {
  key: string;
  value: string;
  risk: "low" | "medium" | "high";
}

export interface ScanResult {
  findings: MetadataFinding[];
  pageCount: number;
}

export interface StripResult {
  bytes: Uint8Array;
  findings: MetadataFinding[];
}

function collectFindings(src: PDFDocument): MetadataFinding[] {
  const findings: MetadataFinding[] = [];
  const push = (key: string, value: string | undefined, risk: MetadataFinding["risk"]) => {
    if (value && String(value).trim()) findings.push({ key, value: String(value).trim(), risk });
  };
  push("Title", src.getTitle(), "low");
  push("Author", src.getAuthor(), "medium");
  push("Subject", src.getSubject(), "low");
  const keywords = src.getKeywords();
  push(
    "Keywords",
    typeof keywords === "string" ? keywords : Array.isArray(keywords) ? (keywords as string[]).join(", ") : undefined,
    "low"
  );
  push("Creator (app)", src.getCreator(), "medium");
  push("Producer (app)", src.getProducer(), "medium");
  const created = src.getCreationDate();
  const modified = src.getModificationDate();
  if (created) push("Created", created.toISOString(), "medium");
  if (modified) push("Modified", modified.toISOString(), "low");
  return findings;
}

/**
 * Scan a PDF for author, creator app, timestamps, and other metadata, without modifying it.
 *
 * @example
 * const { findings, pageCount } = await scanPdfMetadata(file);
 * for (const f of findings) console.log(f.key, f.value, f.risk);
 */
export async function scanPdfMetadata(file: Uint8Array): Promise<ScanResult> {
  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());
  return { findings: collectFindings(src), pageCount: src.getPageCount() };
}

/**
 * Strip the metadata `scanPdfMetadata` finds — title, author, subject, keywords, creator and
 * producer app fields, and creation/modification dates — plus page-level `/Metadata`,
 * `/PieceInfo`, and `FileAttachment` annotations (and their embedded-file streams) that a plain
 * page copy would otherwise silently carry over. Returns the cleaned bytes and what was removed.
 *
 * @example
 * const { bytes, findings } = await stripPdfMetadata(file);
 * console.log("removed:", findings.map((f) => f.key));
 */
export async function stripPdfMetadata(file: Uint8Array): Promise<StripResult> {
  const src = await loadPdf(file);
  assertPageCount(src.getPageCount());
  const findings = collectFindings(src);

  // Rebuild by copying pages into a clean document (drops info dict / XMP-ish baggage pdf-lib doesn't re-emit)
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  // copyPages drops catalog-level XMP / EmbeddedFiles / PieceInfo, but copies per-page /Metadata, /PieceInfo and
  // FileAttachment annotations. Remove those, and delete the objects too: pdf-lib saves unreferenced objects.
  const ctx = out.context;
  const drop = (ref: unknown) => { if (ref instanceof PDFRef) ctx.delete(ref); };
  for (const p of pages) {
    for (const k of ["Metadata", "PieceInfo"]) { drop(p.node.get(PDFName.of(k))); p.node.delete(PDFName.of(k)); }
    const annots = p.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
    if (!annots) continue;
    const keep: PDFRef[] = [];
    for (let i = 0; i < annots.size(); i++) {
      const ref = annots.get(i);
      const a = annots.lookupMaybe(i, PDFDict);
      if (a?.get(PDFName.of("Subtype")) !== PDFName.of("FileAttachment")) { if (ref instanceof PDFRef) keep.push(ref); continue; }
      const spec = a.lookupMaybe(PDFName.of("FS"), PDFDict);
      const ef = spec?.lookupMaybe(PDFName.of("EF"), PDFDict);
      ef?.keys().forEach((k) => drop(ef.get(k)));
      drop(a.get(PDFName.of("FS")));
      drop(ref);
    }
    p.node.set(PDFName.of("Annots"), ctx.obj(keep));
  }
  // Explicitly clear common fields
  out.setTitle("");
  out.setAuthor("");
  out.setSubject("");
  out.setKeywords([]);
  out.setCreator("offlinepdf-sdk");
  out.setProducer("offlinepdf-sdk");

  const bytes = await out.save();
  return { bytes, findings };
}
