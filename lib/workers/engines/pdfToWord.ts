import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { assertPageCount } from "@/lib/pdf/validate";
import { SCANNED_PDF_MESSAGE } from "./extractText";
import { emptyPagesWarning } from "./textItems";

type Line = { text: string; size: number; bold: boolean };

function linesOf(items: unknown[]): Line[] {
  const glyphs: { str: string; x: number; y: number; size: number; font: string }[] = [];
  for (const raw of items) {
    const it = raw as { str?: string; transform?: number[]; height?: number; fontName?: string };
    if (!it.str) continue;
    const t = it.transform ?? [];
    glyphs.push({
      str: it.str,
      x: t[4] ?? 0,
      y: t[5] ?? 0,
      size: Math.abs(t[3] || it.height || 12),
      font: it.fontName ?? "",
    });
  }
  glyphs.sort((a, b) => b.y - a.y || a.x - b.x);
  const groups: typeof glyphs[] = [];
  for (const g of glyphs) {
    const line = groups.find((l) => Math.abs(l[0].y - g.y) < 2.5);
    if (line) line.push(g);
    else groups.push([g]);
  }
  return groups
    .map((line) => {
      line.sort((a, b) => a.x - b.x);
      return {
        text: line.map((g) => g.str).join("").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[ \t]+\n/g, " ").replace(/[ \t]{2,}/g, " ").trim(),
        size: Math.max(...line.map((g) => g.size)),
        bold: line.some((g) => /bold/i.test(g.font)),
      };
    })
    .filter((l) => l.text);
}

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void,
  warn?: (message: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(8, "Loading PDF…");
  const pdf = await pdfjsLib.getDocument({ data: files[0] }).promise;
  assertPageCount(pdf.numPages);
  const children: Paragraph[] = [];
  let any = false;
  let pageBreak = false;
  const empty: number[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(10 + Math.round((i / pdf.numPages) * 75), `Reading page ${i}/${pdf.numPages}…`);
    const content = await (await pdf.getPage(i)).getTextContent();
    const lines = linesOf(content.items);
    if (!lines.length) { empty.push(i); continue; }
    any = true;
    lines.forEach((line, idx) => {
      const heading = line.size >= 16 ? HeadingLevel.HEADING_1 : line.size >= 13 ? HeadingLevel.HEADING_2 : undefined;
      children.push(
        new Paragraph({
          pageBreakBefore: pageBreak && idx === 0,
          heading,
          children: [
            new TextRun({
              text: line.text,
              bold: line.bold || Boolean(heading),
              size: Math.round(Math.min(Math.max(line.size, 9), 28) * 2),
            }),
          ],
        })
      );
    });
    pageBreak = true;
  }
  if (!any) throw new Error(SCANNED_PDF_MESSAGE);
  if (empty.length) warn?.(emptyPagesWarning(empty, pdf.numPages));

  onProgress(90, "Building Word document…");
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  onProgress(100);
  return [{ name: "document.docx", bytes }];
}
