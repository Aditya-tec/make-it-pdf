import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

export type Finding = { key: string; value: string; risk: "low" | "medium" | "high" };

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const strip = Boolean(opts.strip);
  onProgress(10, "Reading metadata…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());

  const findings: Finding[] = [];
  const push = (key: string, value: string | undefined, risk: Finding["risk"]) => {
    if (value && String(value).trim()) findings.push({ key, value: String(value).trim(), risk });
  };

  push("Title", src.getTitle(), "low");
  push("Author", src.getAuthor(), "medium");
  push("Subject", src.getSubject(), "low");
  const keywords = src.getKeywords();
  push("Keywords", typeof keywords === "string" ? keywords : Array.isArray(keywords) ? (keywords as string[]).join(", ") : undefined, "low");
  push("Creator (app)", src.getCreator(), "medium");
  push("Producer (app)", src.getProducer(), "medium");
  const created = src.getCreationDate();
  const modified = src.getModificationDate();
  if (created) push("Created", created.toISOString(), "medium");
  if (modified) push("Modified", modified.toISOString(), "low");

  // Return findings as JSON when not stripping (UI shows them, then user can strip)
  if (!strip) {
    const report = new TextEncoder().encode(JSON.stringify({ findings, pageCount: src.getPageCount() }));
    onProgress(100);
    return [{ name: "scan-report.json", bytes: report }];
  }

  onProgress(50, "Stripping metadata…");
  // Rebuild by copying pages into a clean document (drops info dict / XMP-ish baggage pdf-lib doesn't re-emit)
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  // Explicitly clear common fields
  out.setTitle("");
  out.setAuthor("");
  out.setSubject("");
  out.setKeywords([]);
  out.setCreator("PDF Tools");
  out.setProducer("PDF Tools");

  onProgress(90, "Saving…");
  const bytes = await out.save();
  onProgress(100);
  // Prefix findings so the UI can still show what was removed
  const meta = new TextEncoder().encode(JSON.stringify({ findings }));
  return [
    { name: "cleaned.pdf", bytes },
    { name: "removed-metadata.json", bytes: meta },
  ];
}
