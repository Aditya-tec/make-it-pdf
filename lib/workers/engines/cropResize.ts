import { PDFDocument, PageSizes } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";
import { assertPageCount } from "@/lib/pdf/validate";

type Mode = "margins" | "resize";
type Fit = "contain" | "stretch"; // contain = preserve aspect; stretch = fill and may distort

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const mode = (opts.mode as Mode) || "margins";
  const fit = (opts.fit as Fit) || "contain";
  // margins as fraction of page size (0–0.45)
  const mt = Math.min(0.45, Math.max(0, Number(opts.marginTop ?? 0)));
  const mr = Math.min(0.45, Math.max(0, Number(opts.marginRight ?? 0)));
  const mb = Math.min(0.45, Math.max(0, Number(opts.marginBottom ?? 0)));
  const ml = Math.min(0.45, Math.max(0, Number(opts.marginLeft ?? 0)));
  const target = (opts.target as string) || "a4"; // a4 | letter | keep

  onProgress(10, "Loading…");
  const src = await loadPdf(files[0]);
  assertPageCount(src.getPageCount());

  if (mode === "margins") {
    const pages = src.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const crop = {
        x: width * ml,
        y: height * mb,
        width: width * (1 - ml - mr),
        height: height * (1 - mt - mb),
      };
      page.setCropBox(crop.x, crop.y, crop.width, crop.height);
      page.setMediaBox(crop.x, crop.y, crop.width, crop.height);
      onProgress(10 + Math.round((i / pages.length) * 80), `Cropping page ${i + 1}…`);
    }
    onProgress(95, "Saving…");
    const bytes = await src.save();
    onProgress(100);
    return [{ name: "cropped.pdf", bytes }];
  }

  // Resize: draw each page onto a new page of the target size
  let tw: number, th: number;
  if (target === "letter") [tw, th] = PageSizes.Letter;
  else if (target === "a4") [tw, th] = PageSizes.A4;
  else {
    // keep = use first page size as target for all
    const s = src.getPage(0).getSize();
    tw = s.width;
    th = s.height;
  }

  const out = await PDFDocument.create();
  const count = src.getPageCount();
  const embedded = await out.embedPages(src.getPages());

  for (let i = 0; i < count; i++) {
    onProgress(10 + Math.round((i / count) * 80), `Resizing page ${i + 1}…`);
    const emb = embedded[i];
    const page = out.addPage([tw, th]);
    let dw: number, dh: number, x: number, y: number;
    if (fit === "stretch") {
      dw = tw;
      dh = th;
      x = 0;
      y = 0;
    } else {
      const scale = Math.min(tw / emb.width, th / emb.height);
      dw = emb.width * scale;
      dh = emb.height * scale;
      x = (tw - dw) / 2;
      y = (th - dh) / 2;
    }
    page.drawPage(emb, { x, y, width: dw, height: dh });
  }

  onProgress(95, "Saving…");
  const bytes = await out.save();
  onProgress(100);
  return [{ name: "resized.pdf", bytes }];
}
