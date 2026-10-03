// .epub -> one HTML fragment (chapters in spine order, images inlined). The UI sanitizes and prints it.
// Only EPUB. MOBI/AZW3 are not supported. DRM-protected EPUBs are refused, not worked around.
import { attr, imageMime, resolveZipPath, toBase64, unzipSafe } from "@/lib/pdf/unzipSafe";

const MAX_CHAPTERS = 500;
const MAX_HTML = 40 * 1024 * 1024;
const dec = new TextDecoder();
const FONT_OBFUSCATION = /idpf\.org\/2008\/embedding|ns\.adobe\.com\/pdf\/enc#RC/;

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(5, "Opening EPUB…");
  const zip = unzipSafe(new Uint8Array(files[0]), (n) => /\.(xhtml|html|htm|opf|xml|png|jpe?g|gif|webp)$/i.test(n));

  const container = zip["META-INF/container.xml"];
  if (!container) throw new Error("This doesn't look like an EPUB file. Only .epub is supported — not MOBI or AZW3.");

  const enc = zip["META-INF/encryption.xml"];
  if (enc) {
    const algos = [...dec.decode(enc).matchAll(/<(?:\w+:)?EncryptionMethod\b[^>]*>/g)].map((m) => attr(m[0], "Algorithm") ?? "");
    if (algos.some((a) => !FONT_OBFUSCATION.test(a))) {
      throw new Error("This EPUB is DRM-protected, so it can't be converted. Use a DRM-free copy.");
    }
  }

  const opfPath = attr(dec.decode(container).match(/<rootfile\b[^>]*>/)?.[0] ?? "", "full-path");
  const opfBytes = opfPath ? zip[opfPath] : undefined;
  if (!opfPath || !opfBytes) throw new Error("This EPUB is missing its package file.");
  const opf = dec.decode(opfBytes);

  const manifest = new Map<string, string>();
  for (const t of opf.match(/<item\b[^>]*>/g) ?? []) manifest.set(attr(t, "id") ?? "", resolveZipPath(opfPath, attr(t, "href") ?? ""));
  const spine = [...opf.matchAll(/<itemref\b[^>]*>/g)]
    .map((m) => manifest.get(attr(m[0], "idref") ?? ""))
    .filter((p): p is string => !!p && !!zip[p]);
  if (!spine.length) throw new Error("No readable chapters found in this EPUB.");
  if (spine.length > MAX_CHAPTERS) throw new Error(`This book has ${spine.length} chapters; the limit is ${MAX_CHAPTERS}.`);

  const parts: string[] = [];
  let size = 0;
  spine.forEach((path, i) => {
    onProgress(10 + Math.round((i / spine.length) * 85), `Chapter ${i + 1}/${spine.length}…`);
    let html = dec.decode(zip[path]).replace(/<\?xml[\s\S]*?\?>|<!DOCTYPE[\s\S]*?>/gi, "");
    html = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
    // Only embedded raster images survive; everything else is dropped. Remote URLs are never kept.
    html = html.replace(/(<img\b[^>]*?\bsrc\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi, (_m, pre, a, b) => {
      const src: string = a ?? b ?? "";
      if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(src)) return `${pre}""`;
      const target = resolveZipPath(path, src);
      const mime = imageMime(target);
      const data = zip[target];
      return mime && data ? `${pre}"data:${mime};base64,${toBase64(data)}"` : `${pre}""`;
    });
    size += html.length;
    if (size > MAX_HTML) throw new Error("This book is too large to convert in the browser.");
    parts.push(`<div style="${i ? "page-break-before:always" : ""}">${html}</div>`);
  });

  onProgress(100);
  return [{ name: "converted.html", bytes: new TextEncoder().encode(parts.join("")) }];
}
