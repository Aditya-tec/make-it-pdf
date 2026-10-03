# offlinepdf-sdk

**10 lightweight, zero-native-dependency PDF functions: merge, split, rotate, organize pages, watermark, page numbers, flatten, headers/footers, crop & resize, fingerprint.**

Extracted from [OfflinePDF](https://offlinepdf-woad.vercel.app) — the full tool suite this is extracted from, which has 42 browser-based PDF tools. This package is the subset of that logic that needed no native binaries or WASM to run anywhere Node or a browser can run `pdf-lib`.

Every function takes raw bytes (`Uint8Array`) in and returns raw bytes out. No file system access, no network calls, no DOM. Works in Node and in the browser.

## Install

```bash
npm install offlinepdf-sdk
```

Full usage guide (a "which function do I need" table, plus this same reference): [offlinepdf-woad.vercel.app/sdk](https://offlinepdf-woad.vercel.app/sdk)

## Why this exists

OfflinePDF's website tools run inside Web Workers behind a `postMessage` protocol. These functions are the same logic, pulled out of that wrapper and given a plain async API, so you can use them directly in a script, a server, or your own app — with only `pdf-lib` and `fflate` as dependencies, both pure JavaScript with no native bindings.

## Functions

### `mergePdfs(files: Uint8Array[]): Promise<Uint8Array>`

Merge multiple PDFs into one, in the given order.

```ts
import { mergePdfs } from "offlinepdf-sdk";
import fs from "node:fs";

const a = fs.readFileSync("a.pdf");
const b = fs.readFileSync("b.pdf");
const merged = await mergePdfs([a, b]);
fs.writeFileSync("merged.pdf", merged);
```

### `splitPdf(file: Uint8Array, options?: SplitOptions): Promise<{ name: string; bytes: Uint8Array }[]>`

Split a PDF into individual pages, or into ranges. Returns one file when the result is a single PDF, or a `split.zip` entry when there are several.

```ts
import { splitPdf } from "offlinepdf-sdk";

// One PDF per page, zipped:
const parts = await splitPdf(file);

// A specific range, as a single PDF:
const [range] = await splitPdf(file, { ranges: "1-3, 5" });
```

### `rotatePdf(file: Uint8Array, angle?: 90 | 180 | 270): Promise<Uint8Array>`

Rotate every page by 90, 180, or 270 degrees. Rotation is additive — a page that's already rotated keeps its existing orientation and gets another turn. Defaults to 90.

```ts
import { rotatePdf } from "offlinepdf-sdk";

const rotated = await rotatePdf(file, 180);
```

### `organizePages(file: Uint8Array, ops: PageOp[]): Promise<Uint8Array>`

Reorder, rotate, and drop pages in one pass. `ops` is an **explicit allowlist**: each entry is `{ originalIndex, rotation }`, and the output contains exactly those pages, in that order.

> **This is deletion-by-omission, not a partial patch.** Any page whose index isn't in `ops` is removed — it does not pass through unchanged. If you want to rotate or reorder without deleting anything, every original page index must appear exactly once in `ops`.

```ts
import { organizePages } from "offlinepdf-sdk";

// Keep page 1 as-is, then page 3 rotated 90°. Page 2 (and anything beyond page 3) is dropped.
const out = await organizePages(file, [
  { originalIndex: 0, rotation: 0 },
  { originalIndex: 2, rotation: 90 },
]);

// Rotate every page 90° without dropping any: list all of them.
// (For rotating every page with no reordering/dropping at all, rotatePdf() below is simpler.)
import { PDFDocument } from "pdf-lib";
const total = (await PDFDocument.load(file)).getPageCount();
const rotatedOnly = await organizePages(
  file,
  Array.from({ length: total }, (_, i) => ({ originalIndex: i, rotation: 90 }))
);
```

### `addWatermark(file: Uint8Array, options?: WatermarkOptions): Promise<Uint8Array>`

Stamp a text or image watermark on every page.

```ts
import { addWatermark } from "offlinepdf-sdk";

const out = await addWatermark(file, {
  text: "CONFIDENTIAL",
  opacity: 0.3,
  rotation: 45,
  fontSize: 48,
});

// Or stamp a logo instead of text:
const withLogo = await addWatermark(file, { image: logoBytes });
```

### `addPageNumbers(file: Uint8Array, options?: PageNumberOptions): Promise<Uint8Array>`

Add page numbers to every page, with a chosen format and position. Can skip a cover page.

```ts
import { addPageNumbers } from "offlinepdf-sdk";

const out = await addPageNumbers(file, {
  format: "n/N",          // "n" | "n/N" | "Page n"
  position: "bottom-right", // "bottom-center" | "bottom-left" | "bottom-right" | "top-center"
  skipFirst: true,
});
```

### `flattenPdf(file: Uint8Array): Promise<Uint8Array>`

Flatten interactive form fields into static page content and strip annotations, so filled-in values stay visible but can no longer be edited.

```ts
import { flattenPdf } from "offlinepdf-sdk";

const out = await flattenPdf(file);
```

### `addHeaderFooter(file: Uint8Array, options?: HeaderFooterOptions): Promise<Uint8Array>`

Add a header and/or footer to every page, with an optional date and page number. A semi-transparent white band is drawn behind the text so it stays readable on dark or full-bleed pages.

```ts
import { addHeaderFooter } from "offlinepdf-sdk";

const out = await addHeaderFooter(file, {
  header: "Q3 Report",
  footer: "Confidential",
  includePageNumber: true,
  includeDate: true,
});
```

### `cropPdf(file: Uint8Array, options?: CropOptions): Promise<Uint8Array>`

Crop margins by percentage, or resize every page to a target page size (A4, Letter, or the first page's own size).

```ts
import { cropPdf } from "offlinepdf-sdk";

// Trim a 5% margin on every side:
const trimmed = await cropPdf(file, {
  marginTop: 0.05, marginRight: 0.05, marginBottom: 0.05, marginLeft: 0.05,
});

// Resize every page to A4, preserving aspect ratio:
const resized = await cropPdf(file, { mode: "resize", target: "a4", fit: "contain" });
```

### `fingerprintPdf(file: Uint8Array, options?: FingerprintOptions): Promise<{ bytes: Uint8Array; id: string }>`

Stamp a PDF with a unique ID: a deterrent against leaks, not forensic-grade tracking. The ID sits in the metadata and as near-invisible text on every page, so a leaked copy can be matched back to who received it. A print-to-PDF, flatten, or screenshot can remove it.

Unlike the other functions here, this one returns `{ bytes, id }` rather than just bytes — the ID is the point of running it, and it isn't recoverable from the file by looking at it, so you need to save it yourself.

```ts
import { fingerprintPdf } from "offlinepdf-sdk";

const { bytes, id } = await fingerprintPdf(file, { label: "sent to Acme Corp" });
console.log("fingerprint ID:", id); // write this down — it's shown once and stored nowhere
```

## Limits

Each function enforces the same sane safety caps the website uses: PDFs over 750 pages are rejected, and an operation that would produce output over 750 MB throws rather than exhausting memory. These aren't configurable yet.

## Not yet included

This package covers 10 of OfflinePDF's 42 tools. **Compress, Encrypt PDF, Remove Password, OCR, and the other 32 tools on the website are not in this package** — most of them depend on WASM binaries (qpdf for encryption) or browser-only APIs (`OffscreenCanvas` for image compression) that don't belong in a lightweight, zero-native-dependency package. They may ship as separate add-on packages later; this package will stay honest about what it actually contains rather than imply more than these 10 functions.

For everything else — compress, convert, OCR, redact, and the rest — use the full site: **[offlinepdf-woad.vercel.app](https://offlinepdf-woad.vercel.app)**, free, no account, nothing uploaded.

## License

MIT
