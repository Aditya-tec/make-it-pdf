import { loadQpdf } from "./qpdfLoad";

export async function run(
  files: ArrayBuffer[],
  opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const password = (opts.password as string) || "";
  if (!password) throw new Error("Please enter the current password.");

  onProgress(10, "Initialising…");
  const qpdf = await loadQpdf();

  onProgress(40, "Loading PDF…");
  qpdf.FS.writeFile("/input.pdf", new Uint8Array(files[0]));

  onProgress(60, "Removing password…");
  // --password= unlocks; omit --encrypt to write an unprotected file
  const exitCode: number = qpdf.callMain([
    `--password=${password}`,
    "--decrypt",
    "/input.pdf",
    "/output.pdf",
  ]);
  if (exitCode !== 0) {
    throw new Error("Wrong password, or the PDF is not password-protected / is malformed.");
  }

  onProgress(90, "Reading output…");
  const result: Uint8Array = qpdf.FS.readFile("/output.pdf");
  onProgress(100);
  return [{ name: "unlocked.pdf", bytes: result }];
}
