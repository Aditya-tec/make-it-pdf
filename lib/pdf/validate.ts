// Pure helpers (no DOM) so both the UI and the Web Worker can import them.

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // per file
export const MAX_TOTAL_BYTES = 250 * 1024 * 1024; // per job (e.g. many files into Merge)
export const MAX_PAGES = 500;
export const MAX_OUTPUT_BYTES = 500 * 1024 * 1024; // total generated output (zip / many parts)

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);

// Magic bytes per extension. A renamed .exe fails all of these.
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  // PDF spec allows junk before the header, within the first 1024 bytes
  ".pdf": (b) => new TextDecoder("latin1").decode(b).includes("%PDF-"),
  ".jpg": (b) => starts(b, [0xff, 0xd8, 0xff]),
  ".jpeg": (b) => starts(b, [0xff, 0xd8, 0xff]),
  ".png": (b) => starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ".gif": (b) => starts(b, [0x47, 0x49, 0x46, 0x38]),
  ".webp": (b) => starts(b, [0x52, 0x49, 0x46, 0x46]) && starts(b, [0x57, 0x45, 0x42, 0x50], 8),
  ".docx": (b) => starts(b, [0x50, 0x4b, 0x03, 0x04]),
};

/** Returns an error message, or null if the file is acceptable. */
export async function checkFile(f: File): Promise<string | null> {
  if (f.size === 0) return `"${f.name}" is empty.`;
  if (f.size > MAX_FILE_BYTES) return `"${f.name}" is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`;
  const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
  const matches = SIGNATURES[ext];
  if (!matches) return `"${f.name}": unsupported file type.`;
  const head = new Uint8Array(await f.slice(0, 1024).arrayBuffer());
  return matches(head) ? null : `"${f.name}" isn't a real ${ext} file (its contents don't match its extension).`;
}

export function assertPageCount(n: number) {
  if (n > MAX_PAGES) throw new Error(`This PDF has ${n} pages; this tool supports up to ${MAX_PAGES}.`);
}

export function assertOutputSize(bytes: number) {
  if (bytes > MAX_OUTPUT_BYTES)
    throw new Error("The output would be larger than 500 MB. Try fewer pages or a lower DPI.");
}

/** Turn pdf.js / pdf-lib / runtime errors into a message a user can act on. */
export function friendlyError(err: unknown): string {
  const e = err as { name?: string; message?: string };
  const msg = e?.message ?? String(err);
  if (e?.name === "PasswordException" || /is encrypted/i.test(msg))
    return "This PDF is password-protected. Remove the password first (open it in a PDF viewer, enter the password, then save/print a copy without one).";
  if (e?.name === "InvalidPDFException" || e?.name === "MissingPDFException" || /failed to parse|invalid pdf/i.test(msg))
    return "This file looks corrupted or truncated and can't be read as a PDF.";
  if (/WinAnsi cannot encode/i.test(msg))
    return "The watermark text has characters this tool can't draw yet. Use Latin letters, digits and common punctuation.";
  if (e instanceof RangeError || /out of memory|allocation/i.test(msg))
    return "Your device ran out of memory. Try a smaller file or lower settings.";
  return msg;
}
