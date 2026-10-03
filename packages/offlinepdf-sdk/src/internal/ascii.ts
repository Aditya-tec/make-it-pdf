/** Replace non-ASCII characters with "?" (pdf-lib's standard fonts can't encode them). */
export function ascii(s: string): string {
  return s.replace(/[^\x20-\x7e]/g, "?");
}
