// Real text, absolutely positioned per page — selectable and searchable, not an image.
// The output carries a CSP meta that forbids scripts and network, so it is inert wherever it is opened.
import "@/lib/pdf/pdfjsWorker";
import * as pdfjsLib from "pdfjs-dist";
import { assertPageCount } from "@/lib/pdf/validate";
import { escHtml } from "@/lib/pdf/unzipSafe";
import { SCANNED_PDF_MESSAGE } from "./extractText";
import { pageItems } from "./textItems";

const MAX_PAGES = 300;

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(8, "Loading PDF…");
  const pdf = await pdfjsLib.getDocument({ data: files[0] }).promise;
  assertPageCount(pdf.numPages);
  if (pdf.numPages > MAX_PAGES) throw new Error(`This PDF has ${pdf.numPages} pages; PDF to HTML supports up to ${MAX_PAGES}.`);

  const pages: string[] = [];
  let any = false;
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress(8 + Math.round((i / pdf.numPages) * 85), `Page ${i}/${pdf.numPages}…`);
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1 });
    const spans = (await pageItems(page)).map((it) => {
      any = true;
      const [vx, vy] = vp.convertToViewportPoint(it.x, it.y);
      const size = Math.max(it.h, 1);
      return `<span style="left:${vx.toFixed(1)}pt;top:${(vy - size * 0.85).toFixed(1)}pt;font-size:${size.toFixed(1)}pt;font-family:${it.family}">${escHtml(it.str)}</span>`;
    });
    pages.push(`<section style="width:${vp.width.toFixed(0)}pt;height:${vp.height.toFixed(0)}pt" aria-label="Page ${i}">${spans.join("")}</section>`);
  }
  if (!any) throw new Error(SCANNED_PDF_MESSAGE);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Converted PDF</title><style>
body{background:#ddd;margin:0;padding:12pt}
section{position:relative;background:#fff;margin:0 auto 12pt;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.3);page-break-after:always}
span{position:absolute;white-space:pre;line-height:1;color:#000}
@media print{body{background:#fff;padding:0}section{box-shadow:none;margin:0}}
</style></head><body>${pages.join("")}</body></html>`;
  onProgress(100);
  return [{ name: "document.html", bytes: new TextEncoder().encode(html) }];
}
