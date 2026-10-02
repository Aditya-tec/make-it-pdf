import { PDFDocument, PageSizes } from "pdf-lib";

type PageMode = "fit" | "a4" | "letter";

// pdf-lib only embeds JPG and PNG; WebP/GIF are re-encoded to PNG via the browser's decoder.
async function embeddable(bytes: Uint8Array): Promise<{ jpg: boolean; bytes: Uint8Array }> {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return { jpg: true, bytes };
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return { jpg: false, bytes };
  const bmp = await createImageBitmap(new Blob([bytes.buffer as ArrayBuffer]));
  const canvas = new OffscreenCanvas(bmp.width, bmp.height);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  const blob = await canvas.convertToBlob({ type: "image/png" });
  return { jpg: false, bytes: new Uint8Array(await blob.arrayBuffer()) };
}

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const mode: PageMode = (opts.pageSize as PageMode) || "fit";
  const pdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress(Math.round((i / files.length) * 90), `Adding image ${i + 1}/${files.length}…`);
    const src = await embeddable(new Uint8Array(files[i]));
    const image = src.jpg ? await pdf.embedJpg(src.bytes) : await pdf.embedPng(src.bytes);

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
