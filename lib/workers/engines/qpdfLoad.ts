/* Shared qpdf WASM loader, Encrypt + Remove Password. Needs COOP/COEP. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function loadQpdf(): Promise<any> {
  if (!self.crossOriginIsolated) {
    throw new Error(
      "This tool needs a cross-origin isolated page (COOP/COEP headers). Reload and try again."
    );
  }
  const base = new URL("/qpdf/", self.location.origin).href;
  const init = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ `${base}qpdf.js`)).default;
  return init({
    locateFile: (f: string) => base + f,
    print: () => {},
    printErr: () => {},
  });
}
