# offlinepdf-sdk

**7 lightweight, zero-native-dependency PDF functions: merge, split, rotate, organize pages, watermark, page numbers, flatten.**

Extracted from [OfflinePDF](https://offlinepdf-woad.vercel.app) — the full tool suite this is extracted from, which has 42 browser-based PDF tools. This package is the subset of that logic that needed no native binaries or WASM to run anywhere Node or a browser can run `pdf-lib`.

Every function takes raw bytes (`Uint8Array`) in and returns raw bytes out. No file system access, no network calls, no DOM. Works in Node and in the browser.

## Install

```bash
npm install offlinepdf-sdk
```

## Why this exists

OfflinePDF's website tools run inside Web Workers behind a `postMessage` protocol. These 7 functions are the same logic, pulled out of that wrapper and given a plain async API, so you can use them directly in a script, a server, or your own app — with only `pdf-lib` and `fflate` as dependencies, both pure JavaScript with no native bindings.

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

## Limits

Each function enforces the same sane safety caps the website uses: PDFs over 750 pages are rejected, and an operation that would produce output over 750 MB throws rather than exhausting memory. These aren't configurable yet.

## Not yet included

This package covers 7 of OfflinePDF's 42 tools. **Compress, Encrypt PDF, Remove Password, OCR, and the other 35 tools on the website are not in this package** — most of them depend on WASM binaries (qpdf for encryption) or browser-only APIs (`OffscreenCanvas` for image compression) that don't belong in a lightweight, zero-native-dependency package. They may ship as separate add-on packages later; this package will stay honest about what it actually contains rather than imply more than these 7 functions.

For everything else — compress, convert, OCR, redact, and the rest — use the full site: **[offlinepdf-woad.vercel.app](https://offlinepdf-woad.vercel.app)**, free, no account, nothing uploaded.

## License

MIT
