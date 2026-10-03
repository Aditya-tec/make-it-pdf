import { unzipSync } from "fflate";

const MB = 1024 * 1024;

/**
 * Unzip only the entries `want` accepts, refusing zip bombs: each entry and the running total are
 * checked against the sizes declared in the archive before anything is inflated.
 */
export function unzipSafe(
  bytes: Uint8Array,
  want: (name: string) => boolean,
  maxEach = 30 * MB,
  maxTotal = 200 * MB
): Record<string, Uint8Array> {
  let total = 0;
  let entries = 0;
  try {
    return unzipSync(bytes, {
      filter(f) {
        if (!want(f.name)) return false;
        if (++entries > 5000) throw new Error("too many entries");
        if (f.originalSize > maxEach) throw new Error("entry too large");
        if ((total += f.originalSize) > maxTotal) throw new Error("archive too large");
        return true;
      },
    });
  } catch (e) {
    const m = String((e as Error)?.message ?? e);
    if (/too (large|many)/.test(m)) {
      throw new Error("This file expands to far more data than expected, so it was not opened.");
    }
    throw new Error("This file is not a valid zip-based document (it may be corrupted).");
  }
}

/** Resolve `rel` against the folder of `from` inside a zip, POSIX style. */
export function resolveZipPath(from: string, rel: string): string {
  const clean = decodeURIComponent(rel.split("#")[0].split("?")[0]);
  const parts = (clean.startsWith("/") ? clean.slice(1) : from.split("/").slice(0, -1).join("/") + "/" + clean).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return out.join("/");
}

export function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`(?:^|[\\s<])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[1] ?? m[2]) : undefined;
}

export function xmlText(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(Math.min(parseInt(h, 16), 0x10ffff)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Math.min(Number(d), 0x10ffff)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const IMG_MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };
export function imageMime(path: string): string | undefined {
  return IMG_MIME[(path.split(".").pop() ?? "").toLowerCase()];
}

export function toBase64(u8: Uint8Array): string {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
}
