# offlinepdf-mcp

A local [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
[OfflinePDF](https://offlinepdf-woad.vercel.app)'s PDF tools as functions Claude (Desktop,
Code, or any other MCP client) can call directly on your machine.

**Nothing leaves your device.** Every tool reads a file from disk, does its work locally in
the Node process, and writes the result back to disk. There is no network call, no upload,
no telemetry — the same "your files never leave your computer" guarantee as the OfflinePDF
website and the `offlinepdf-sdk` npm package, extended to a server an LLM can call directly.
The one deliberate exception is also offline: OCR's language model is bundled inside this
package, not fetched from a CDN (see "OCR" below for how that's enforced).

## What's in this version — 17 tools

**12 tools wrapping [`offlinepdf-sdk`](../offlinepdf-sdk)**, thin wrappers with no logic
duplication — same behavior as the SDK, just with file-path I/O instead of byte arrays:

| Tool | What it does |
|---|---|
| `merge_pdfs` | Combine multiple PDFs into one |
| `split_pdf` | Split by page ranges, or one file per page |
| `rotate_pdf` | Rotate every page 90/180/270° |
| `organize_pdf_pages` | Reorder, rotate, or delete specific pages |
| `watermark_pdf` | Stamp a text or image watermark |
| `add_page_numbers` | Add page numbers in various formats/positions |
| `flatten_pdf` | Flatten fillable form fields |
| `add_header_footer` | Add a header/footer, optional date and page number |
| `crop_pdf` | Trim margins, or resize pages to a target size |
| `fingerprint_pdf` | Stamp a leak-deterrent ID (metadata + near-invisible text) |
| `scan_pdf_metadata` / `strip_pdf_metadata` | Find, then remove, privacy-sensitive metadata |
| `csv_to_pdf` | Convert a CSV into a paginated PDF table |

**4 new, Node-native tools**, written directly for this server (not forced through the
website's browser-shaped engine code):

| Tool | What it does |
|---|---|
| `extract_pdf_text` | Extract a PDF's text layer, page by page |
| `ocr_pdf` | OCR a scanned/image-only PDF (English, fully offline) |
| `repair_pdf` | Repair a damaged PDF (2 of the website's 3 strategies — see below) |
| `generate_pos_receipt` | Generate a simplified GST receipt/bill PDF |

### OCR: offline by construction, not by convention

`ocr_pdf` uses [`tesseract.js`](https://github.com/naptha/tesseract.js) with two settings
that are **hard requirements, not defaults that happen to work**:

- `langPath` points at the English language model bundled inside this package
  (`src/assets/tess/lang/eng.traineddata.gz`), never left unset. Unset, tesseract.js
  downloads from the jsdelivr CDN on first use — a real network call this server must never
  make.
- `cachePath` points at a dedicated OS temp directory, never left unset. Unset, tesseract.js
  caches the traineddata file in whatever directory the process happens to be run from — for
  an MCP server, that's the caller's arbitrary working directory, not somewhere this package
  controls.

Both of these were failure modes found empirically while scoping this feature (it silently
downloaded 5MB from a CDN and wrote a file into the test's cwd by default), not theoretical
concerns — see `test/mcp.check.ts`'s `testOcrOfflineFromBundledData`, which blocks `fetch`
entirely and confirms OCR still works from the bundled file alone.

PDF pages are rasterized with [`@napi-rs/canvas`](https://github.com/Brooooooklyn/canvas)
rather than `node-canvas`: it ships prebuilt native binaries for every platform, where
`node-canvas` requires system-level Cairo/Pango libraries and is a common source of broken
installs. Only English is bundled; adding another language means bundling its traineddata
too, which isn't done here to keep the package size reasonable.

### Extract Text: two gotchas fixed during scoping

`pdfjs-dist`'s default export throws `Promise.try is not a function` in plain Node — its own
console warning says to use the Node/legacy build instead, so this package imports from
`pdfjs-dist/legacy/build/pdf.mjs`, not the package root. `standardFontDataUrl` is also set
explicitly to a bundled copy of `pdfjs-dist/standard_fonts/`, avoiding a glyph-width warning
(and incorrect text spacing) on PDFs whose fonts aren't fully embedded.

### Repair PDF: honest about partial scope

The website's Repair PDF tool has three recovery strategies; this server only has the first
two (a strict clean rebuild, then a lenient rebuild that skips broken objects) — see "Not yet
included" for why the third isn't here. If a file needs the third strategy, `repair_pdf`
fails with an explicit message saying so, rather than silently giving up or returning
strategy 2's partial result as if it were a complete fix.

## Not yet included

These were scoped and deliberately left out of this version, with the real reason, not a
placeholder:

- **Encrypt PDF, Remove Password, and Repair PDF's third recovery strategy** — all three
  depend on `qpdf` compiled to WebAssembly. Empirical testing during scoping found this isn't
  a simple "needs `crossOriginIsolated`" browser-API gate: the qpdf build is **pthread-enabled**
  (it spawns itself as a `Worker` for multi-threaded execution via `SharedArrayBuffer`/`Atomics`).
  Loading it in plain Node throws `ReferenceError: Worker is not defined` — there's no global
  `Worker` in Node. Fixing this needs either a `Worker` polyfill library (untested whether the
  pthread fan-out actually works headless under one) or a separately-built single-threaded qpdf
  WASM artifact. That's real engineering work, not a thin wrapper, so it's out of this version.
- **Compress** — relies on image re-encoding tuned for the website's in-browser pipeline;
  not yet scoped for a standalone Node context.
- **PDF to JPG, Scan to PDF** — raster/camera-input-shaped tools whose value is largely the
  website's UI around them; not scoped for this version.
- **Compare** — a two-pane visual diff tool; its output is inherently a UI, not a file, so it
  doesn't fit this server's file-in/file-out model.
- **Office conversions (Word/PowerPoint/etc.)** — a different, heavier dependency surface
  (`mammoth`, `docx`, `pptxgenjs`) not yet evaluated for this package.
- **P2P / Whiteboard** — real-time collaboration features with no meaning for a local,
  single-call MCP tool.

## Installation

This package isn't published to npm — it lives in the [make-it-pdf](https://github.com/Aditya-tec/make-it-pdf)
repo as an npm workspace, the same way [`offlinepdf-sdk`](../offlinepdf-sdk) does. To use it
on any machine, clone the whole repo (this package depends on `offlinepdf-sdk` as a workspace
package, not a published one, so a bare copy of just this folder won't build):

```bash
git clone https://github.com/Aditya-tec/make-it-pdf.git
cd make-it-pdf
npm install          # installs workspace dependencies for every package, including this one
cd packages/offlinepdf-mcp
npm run build
```

Requires Node.js 18+ (same as `manifest.json`'s `compatibility.runtimes.node`). This produces
`dist/index.js`, a single bundled ESM file (with `dist/assets/` alongside it for the OCR
language data and PDF standard fonts) — enough to run `node dist/index.js` directly, or to
move on to packing it as a Claude Desktop extension below.

## Claude Desktop setup (MCPB extension)

Current Claude Desktop versions install local MCP servers as an **MCPB** extension (a
`.mcpb` bundle with a `manifest.json`), not via a hand-edited `claude_desktop_config.json`.
This package includes that packaging already: `manifest.json` at the package root, validated
against the official schema with the [`@anthropic-ai/mcpb`](https://github.com/modelcontextprotocol/mcpb)
CLI (`npm install -g @anthropic-ai/mcpb`; `mcpb validate manifest.json`).

**Build and pack the bundle:**

```bash
cd packages/offlinepdf-mcp
npm run mcpb:pack
```

This runs the build, stages a self-contained copy (see "Why staging?" below), and produces
`offlinepdf-mcp-0.1.0.mcpb` in the package root.

**Install it:** per Anthropic's current MCPB docs, the supported install paths are
double-clicking the `.mcpb` file, dragging it into the Claude Desktop window, or
**Settings → Extensions → Advanced settings → Install Extension…** and selecting the `.mcpb`
file. The docs describe packing into `.mcpb` as the only supported path — there is no
documented "point Claude Desktop at a raw folder" flow in the current spec. If your Settings
dialog is labeled "Install unpacked extension," try pointing it at the packed `.mcpb` file
first (some dialogs accept either a file or a folder under that same label); if it strictly
requires a folder, unzip the `.mcpb` (it's a zip archive) and point it at the unzipped folder.
This note exists because the label in some Desktop builds doesn't match the terminology in
the current official docs — treat the `.mcpb` file as the authoritative artifact either way.

### Why staging? (`npm run stage`)

This package lives in an npm workspace: its dependencies are hoisted to the repo root's
`node_modules`, and `offlinepdf-sdk` is a workspace symlink, not a published package. Packing
`packages/offlinepdf-mcp/` directly (without staging) produces a `.mcpb` whose `dist/index.js`
can't resolve `zod`, `pdf-lib`, `@modelcontextprotocol/sdk`, etc. once extracted into Claude
Desktop's extensions directory — there's no monorepo root above it to hoist from. This was
caught empirically, not assumed: the first packed build loaded fine inside the monorepo (where
it could silently fall back to the hoisted root `node_modules`) but threw `Cannot find module`
when tested from a directory fully outside it, which is what Claude Desktop's real install
location looks like. `npm run stage` (`scripts/stage-bundle.mjs`) builds a standalone copy with
a real, physically-present `node_modules`, installed fresh from the registry, plus
`offlinepdf-sdk`'s already-built `dist/` copied in directly (it isn't published, so it can't be
`npm install`ed) along with its own transitive dependencies. `npm run mcpb:pack` always stages
before packing — don't run `mcpb pack .` directly on the source tree.

## Claude Code setup

Either add it to a project's `.mcp.json`:

```json
{
  "mcpServers": {
    "offlinepdf": {
      "command": "node",
      "args": ["/absolute/path/to/make-it-pdf/packages/offlinepdf-mcp/dist/index.js"]
    }
  }
}
```

or register it with the CLI:

```bash
claude mcp add offlinepdf -- node /absolute/path/to/make-it-pdf/packages/offlinepdf-mcp/dist/index.js
```

Replace `/absolute/path/to/make-it-pdf` with wherever you cloned the repo (step above).

## Testing

```bash
npm test
```

Runs `test/mcp.check.ts`: a plain `node:assert` + `tsx` suite (same style as
`offlinepdf-sdk/test/sdk.check.ts`) that exercises every tool's core logic directly —
including the hard-requirement OCR-offline check — without needing a live MCP client.

**This automated suite cannot be the final word.** It's been supplemented with isolated
integration checks — the packed `.mcpb`'s staged contents run fully outside this repo (so
none of its dependencies can silently resolve from a hoisted monorepo `node_modules`), and
with Claude Desktop's exact Electron `utilityProcess` signature simulated (`process.type =
"utility"`, `process.versions.electron` set) — and real tool calls (`merge_pdfs`,
`extract_pdf_text`, `ocr_pdf`) verified correct under both. What none of that replaces is
Claude Desktop itself, live: tool descriptions are read and interpreted by a model, argument
schemas are enforced by a real client, and the stdio transport is driven by Claude Desktop's
own process management and whatever else differs about its actual host environment. Installing
the packed `.mcpb` (see "Claude Desktop setup (MCPB extension)" above) in a real Claude
Desktop and confirming it discovers and calls these tools correctly in a live session is still
the step that proves this end to end.

## Troubleshooting: slow or failed startup

`index.ts` logs a few one-line timestamps to stderr on every startup (`[offlinepdf-mcp] +Nms
...`), from process start through `server.connect()`. In a plain terminal this should read
something like `+0ms starting` → `+20ms tools registered...` → `+20ms connected`. If Claude
Desktop reports a connection timeout, check its extension logs for this prefix: a long gap
before "connected" (or no "connected" line at all) points at the startup path, not a tool bug.

Only 2 of the 17 tools (`extract_pdf_text`, `ocr_pdf`) depend on `pdfjs-dist`, and only
`ocr_pdf` additionally depends on `tesseract.js` and the native addon `@napi-rs/canvas`. All
three are lazy-loaded (dynamic `import()`) inside those tools' handlers, not at module top
level — importing them eagerly at startup was an earlier version's real bug: every server
start paid their load cost (pdfjs-dist alone took ~0.6s in a plain terminal) whether or not
those two tools were ever called, and in a sandboxed host process that extra startup work is
exactly the kind of thing that can push a slow environment over a connection timeout. Each
lazy-load point also logs `lazy-loading ...` / `lazy-load complete` to stderr, so if OCR or
extract-text themselves are ever slow to start, the logs show whether it's the import or the
actual PDF work that's taking the time.

## Troubleshooting: `extract_pdf_text` / `ocr_pdf` fail, other tools work fine

If `merge_pdfs` and similar tools work but `extract_pdf_text` or `ocr_pdf` fail with
`No "GlobalWorkerOptions.workerSrc" specified.` or `Cannot read properties of undefined
(reading 'createElement')`, this is a known environment-detection bug in pdfjs-dist, already
fixed in `src/native/pdfjsLoader.ts` — if you're seeing it, you're likely running an older
build (run `npm run build` again).

Root cause: pdfjs-dist decides whether it's running in Node with
`!(process.versions.electron && process.type && process.type !== "browser")`. Claude
Desktop's "built-in Node.js" MCP host is actually an Electron `utilityProcess`
(`process.type === "utility"`), which this check deliberately treats as browser-like, not
Node — so pdfjs-dist picks DOM-based defaults (a real `Worker` + `workerSrc`, a
`document.createElement("canvas")` factory, a `fetch()`-based binary data loader) that don't
exist in Node and crash. `pdfjsLoader.ts` forces every one of those defaults back to what
real Node would have picked, regardless of what pdfjs-dist's check concludes.
`test/electron-env.check.ts` (run by `npm test`) simulates exactly this host signature
(`process.type = "utility"`, `process.versions.electron` set) in its own process, so this
class of bug fails loudly in CI rather than only showing up live in Claude Desktop.

## Not published

This package has not been published to npm, and has not been submitted to any MCP server
directory or registry. It exists only in this monorepo pending the manual Claude Desktop
verification above.
