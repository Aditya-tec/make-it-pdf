/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { loadPdf } from "@/lib/pdf/load";

const PRESETS: Record<string, { quality: number; maxDim: number }> = {
  light: { quality: 0.85, maxDim: 2400 },
  medium: { quality: 0.65, maxDim: 1800 },
  heavy: { quality: 0.40, maxDim: 1200 },
};

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const preset = PRESETS[(opts.level as string) || "medium"];
  const src = await loadPdf(files[0]);
  onProgress(10, "Analysing images…");

  const refs = src.context.enumerateIndirectObjects();
  const imageRefs = refs.filter(([, obj]) => {
    if (!(obj instanceof PDFRawStream)) return false;
    const sub = obj.dict.get(PDFName.of("Subtype"));
    return sub?.toString() === "/Image";
  });

  let done = 0;
  for (const [ref, obj] of imageRefs) {
    if (!(obj instanceof PDFRawStream)) continue;
    try {
      const stream = obj as any; // use any to bypass readonly on contents
      const w = (stream.dict.get(PDFName.of("Width")) as any)?.value as number | undefined;
      const h = (stream.dict.get(PDFName.of("Height")) as any)?.value as number | undefined;
      if (!w || !h || w * h < 10000) continue;

      const raw: Uint8Array = stream.contents;
      const blob = new Blob([raw.buffer as ArrayBuffer], { type: "image/jpeg" });
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(blob);
      } catch {
        continue; // not a JPEG, skip
      }

      const scale = Math.min(1, preset.maxDim / Math.max(bitmap.width, bitmap.height));
      const dw = Math.round(bitmap.width * scale);
      const dh = Math.round(bitmap.height * scale);

      const canvas = new OffscreenCanvas(dw, dh);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0, dw, dh);
      bitmap.close();

      const reBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: preset.quality });
      const reBytes = new Uint8Array(await reBlob.arrayBuffer());

      stream.contents = reBytes;
      stream.dict.set(PDFName.of("Width"), src.context.obj(dw));
      stream.dict.set(PDFName.of("Height"), src.context.obj(dh));
      stream.dict.set(PDFName.of("Length"), src.context.obj(reBytes.length));
      stream.dict.delete(PDFName.of("Filter"));
      stream.dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
    } catch {
      // skip unreadable streams
    }

    done++;
    onProgress(10 + Math.round((done / Math.max(imageRefs.length, 1)) * 80), "Compressing images…");
    void ref;
  }

  onProgress(95, "Saving…");
  const bytes = await src.save({ useObjectStreams: true });
  onProgress(100);
  return [{ name: "compressed.pdf", bytes }];
}
