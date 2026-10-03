import { Zip, ZipPassThrough } from "fflate";
import { assertOutputSize } from "./validate";

/** Store-only zip (no compression), so output size == sum of inputs; we cap that sum. */
export function zipFiles(files: { name: string; bytes: Uint8Array }[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      assertOutputSize(files.reduce((n, f) => n + f.bytes.length, 0));
    } catch (e) {
      return reject(e);
    }
    const chunks: Uint8Array[] = [];
    const zip = new Zip((err, chunk, final) => {
      if (err) return reject(err);
      chunks.push(chunk);
      if (final) {
        const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
        let off = 0;
        for (const c of chunks) { out.set(c, off); off += c.length; }
        resolve(out);
      }
    });
    for (const f of files) {
      const entry = new ZipPassThrough(f.name);
      zip.add(entry);
      entry.push(f.bytes, true);
    }
    zip.end();
  });
}
