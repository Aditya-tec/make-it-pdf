// qpdf (WASM build of the qpdf CLI) does the AES-256 encryption; pdf-lib can't encrypt.
// qpdf.js / qpdf.wasm are copied from node_modules into public/qpdf/ by the `prebuild` script and
// loaded from our own origin (no CDN). qpdf is multi-threaded, so its pthread workers re-load qpdf.js
// by URL — which is why it must be a real file rather than bundled. Needs COOP/COEP headers (vercel.json).
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const password = (opts.password as string) || "";
  if (!password) throw new Error("Please enter a password.");

  if (!self.crossOriginIsolated)
    throw new Error("Encryption needs a cross-origin isolated page (COOP/COEP headers). Reload and try again.");

  onProgress(10, "Initialising encryption engine…");
  const base = new URL("/qpdf/", self.location.origin).href;
  const init = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${base}qpdf.js`)).default;
  const qpdf: any = await init({
    locateFile: (f: string) => base + f,
    print: () => {},
    printErr: () => {},
  });

  onProgress(40, "Loading PDF…");
  qpdf.FS.writeFile("/input.pdf", new Uint8Array(files[0]));

  onProgress(60, "Encrypting…");
  // qpdf --encrypt <user-pass> <owner-pass> 256 -- in out
  const exitCode: number = qpdf.callMain(["--encrypt", password, password, "256", "--", "/input.pdf", "/output.pdf"]);
  if (exitCode !== 0) {
    throw new Error("Encryption failed. The PDF may be malformed or already encrypted.");
  }

  onProgress(90, "Reading output…");
  const result: Uint8Array = qpdf.FS.readFile("/output.pdf");
  onProgress(100);
  return [{ name: "encrypted.pdf", bytes: result }];
}
