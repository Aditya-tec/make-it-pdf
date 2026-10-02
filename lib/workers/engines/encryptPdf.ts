// ponytail: qpdf-wasm CLI wrapper for AES-256 PDF encryption.
// The WASM module exposes an Emscripten FS + callMain.
// Ceiling: qpdf-wasm is single-threaded; very large PDFs may be slow.
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const password = (opts.password as string) || "";
  if (!password) throw new Error("Please enter a password.");

  onProgress(10, "Initialising encryption engine…");

  // Dynamic import so the WASM doesn't load on every other tool
  const initQpdf = (await import("qpdf-wasm")).default;
  const qpdf: any = await initQpdf({
    // Silence qpdf stdout/stderr in the worker
    print: () => {},
    printErr: () => {},
  });

  onProgress(40, "Loading PDF…");

  // Write input to WASM virtual FS
  qpdf.FS.writeFile("/input.pdf", new Uint8Array(files[0]));

  onProgress(60, "Encrypting…");

  // qpdf --encrypt <user-pass> <owner-pass> 256 -- input.pdf output.pdf
  const exitCode: number = qpdf.callMain([
    "--encrypt",
    password,
    password, // owner = user pass for simplicity
    "256",
    "--",
    "/input.pdf",
    "/output.pdf",
  ]);

  if (exitCode !== 0) {
    throw new Error("Encryption failed. The PDF may be malformed or already encrypted.");
  }

  onProgress(90, "Reading output…");
  const result: Uint8Array = qpdf.FS.readFile("/output.pdf");

  // Cleanup WASM FS
  try { qpdf.FS.unlink("/input.pdf"); } catch { /* ok */ }
  try { qpdf.FS.unlink("/output.pdf"); } catch { /* ok */ }

  onProgress(100);
  return [{ name: "encrypted.pdf", bytes: result }];
}
