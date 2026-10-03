/** Safety caps so a pathological PDF cannot exhaust memory. */
export const MAX_PAGES = 750;
export const MAX_OUTPUT_BYTES = 750 * 1024 * 1024;

export function assertPageCount(n: number) {
  if (n > MAX_PAGES) {
    throw new Error(`This PDF has ${n} pages; this function supports up to ${MAX_PAGES}.`);
  }
}

export function assertOutputSize(bytes: number) {
  if (bytes > MAX_OUTPUT_BYTES) {
    throw new Error(
      `The output would be larger than ${MAX_OUTPUT_BYTES / 1024 / 1024} MB. Try fewer pages.`
    );
  }
}
