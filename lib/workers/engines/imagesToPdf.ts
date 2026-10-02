import { PDFDocument, PageSizes } from "pdf-lib";

type PageMode = "fit" | "a4" | "letter";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const mode: PageMode = (opts.pageSize as PageMode) || "fit";
  const pdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress(Math.round((i / files.length) * 90), `Adding image ${i + 1}/${files.length}…`);
    const bytes = new Uint8Array(files[i]);
    // detect image type by magic bytes
    let image;
    if (bytes[0] === 0xff && bytes[1] === 0xd8) {
      image = await pdf.embedJpg(bytes);
    } else {
      image = await pdf.embedPng(bytes);
    }

    let pageW: number, pageH: number;
    if (mode === "a4") {
      [pageW, pageH] = PageSizes.A4;
    } else if (mode === "letter") {
      [pageW, pageH] = PageSizes.Letter;
    } else {
      // fit: page sized to image
      pageW = image.width;
      pageH = image.height;
    }

    const page = pdf.addPage([pageW, pageH]);
    const scale = Math.min(pageW / image.width, pageH / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    page.drawImage(image, {
      x: (pageW - w) / 2,
      y: (pageH - h) / 2,
      width: w,
      height: h,
    });
  }

  onProgress(95, "Saving…");
  const out = await pdf.save();
  onProgress(100);
  return [{ name: "images.pdf", bytes: out }];
}
