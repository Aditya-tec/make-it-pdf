# OfflinePDF

Privacy-first PDF tools that run entirely in your browser. Your files never leave your device — no uploads, no accounts, no watermarks.

![OfflinePDF homepage](docs/screenshot.png)

**Live site:** hosted on [Vercel](https://vercel.com) (set `NEXT_PUBLIC_SITE_URL` to your production domain).

---

## Why OfflinePDF

Most free PDF sites upload your documents to a server. OfflinePDF does the opposite: every tool runs locally via WebAssembly and Web Workers. Close the tab and the file is gone.

- **Works offline after one visit:** a service worker (`public/sw.js`, filled with the build's file list by `scripts/make-sw.mjs`) caches the pages, JS, and the qpdf/Tesseract WASM and model files, and the site is installable as a PWA. This covers every tool except **P2P Share and Whiteboard**, which need a live connection by design and show an "unavailable offline" page. The large WASM/model files are cached in the background after first load, so the first offline use is only safe once that finishes (a few seconds on a normal connection). Verified by `npm run e2e` (Merge, Compress, and Encrypt run with the network cut).
- **42 tools** across essentials, edit & organize, security, convert, and capture & share
- **Tiered size limits** (light tools up to 300&nbsp;MB; heavy tools 150&nbsp;MB; OCR 75&nbsp;MB / 75 pages)  
- **Search + voice** in the header to jump to the best tool  

---

## Tools

| Category | Tools |
|----------|--------|
| **Essentials** | [Merge PDF](/merge-pdf), [Split PDF](/split-pdf), [Compress PDF](/compress-pdf) |
| **Edit & Organize** | [Organize Pages](/organize-pages), [Add Watermark](/add-watermark), [Extract Text](/extract-text), [Rotate PDF](/rotate-pdf), [Crop & Resize](/crop-resize), [Page Numbers](/page-numbers), [Headers & Footers](/headers-footers), [OCR PDF](/ocr-pdf), [Compare PDFs](/compare-pdfs), [Repair PDF](/repair-pdf), [Edit PDF Text](/edit-pdf-text) |
| **Security** | [Encrypt PDF](/encrypt-pdf), [Remove Password](/remove-password), [Flatten PDF](/flatten-pdf), [Redact PDF](/redact-pdf), [Privacy Scanner](/privacy-scanner), [Fingerprint PDF](/fingerprint-pdf) |
| **Convert** | [PDF to JPG](/pdf-to-jpg), [Images to PDF](/images-to-pdf), [Word to PDF](/word-to-pdf), [Invert Colours](/invert-colors), [PDF to ZIP](/pdf-to-zip), [Markdown to PDF](/markdown-to-pdf), [HTML to PDF](/html-to-pdf), [CSV to PDF](/csv-to-pdf), [Excel to PDF](/excel-to-pdf), [PDF to Word](/pdf-to-word), [Create PDF](/create-pdf), [PDF to EPUB](/pdf-to-epub), [PowerPoint to PDF](/powerpoint-to-pdf), [PDF to PowerPoint](/pdf-to-powerpoint), [PDF to Excel](/pdf-to-excel), [PDF to HTML](/pdf-to-html), [eBook to PDF](/ebook-to-pdf), [PDF to Audio](/pdf-to-audio) *(listen only)* |
| **Capture, Share & Create** | [POS Billing](/pos-billing), [Scan to PDF](/scan-to-pdf), [P2P Share](/p2p-share)\*, [Collaborative Whiteboard](/whiteboard)\* |

*\* P2P Share and Whiteboard connect two browsers directly peer-to-peer using WebRTC DataChannel (PeerJS signaling + Google STUN). No files or drawings are ever stored on any server.*

How-to guides live under `/blog`.

---

## SDK package

12 of these tools — merge, split, rotate, organize pages, watermark, page numbers, flatten, headers/footers, crop & resize, fingerprint, scan/strip metadata, and CSV to PDF — are also published as a standalone, zero-native-dependency npm package: **[offlinepdf-sdk](https://www.npmjs.com/package/offlinepdf-sdk)**.

```bash
npm install offlinepdf-sdk
```

It lives in this repo as an npm workspace at [`packages/offlinepdf-sdk`](packages/offlinepdf-sdk); the website's own worker engines for those 12 tools import directly from it, so there's one source of truth rather than a forked copy. See the [usage guide](https://offlinepdf-woad.vercel.app/sdk) for a "which function do I need" walkthrough, or that package's [README](packages/offlinepdf-sdk/README.md) for the full API and what's intentionally not included yet.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| App | Next.js 16 (App Router, static `output: "export"`), React 19, TypeScript |
| UI | Tailwind CSS 4, `@tailwindcss/typography` |
| PDF | pdf-lib, pdf.js |
| Encrypt | qpdf-wasm (AES-256; COOP/COEP only on encrypt/unlock routes — see `vercel.json`) |
| OCR | tesseract.js (English model bundled; no CDN) |
| Word | mammoth (Word → PDF), docx (PDF → Word) |
| PowerPoint | pptxgenjs (PDF → PowerPoint), fflate XML parser (PowerPoint → PDF) |
| Spreadsheets | SheetJS (`xlsx` v0.20.3 via CDN) for Excel → PDF and PDF → Excel |
| HTML / Markdown | DOMPurify, marked |
| Zip | fflate |
| Realtime & P2P | PeerJS (WebRTC DataChannel), Google STUN (`p2p-share`, `whiteboard`) |
| Camera & Audio | Web MediaDevices (`scan-to-pdf`), Web Speech Synthesis (`pdf-to-audio`) |
| QR Codes | qrcode-generator (`p2p-share`, `whiteboard`) |
| Hosting | Vercel (auto-deploy from `main`) |

All processing runs in a single Web Worker entry (`lib/workers/pdf.worker.ts`) that lazy-loads per-tool engines.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static site → out/
```

> **Note:** `next dev` does not apply `vercel.json` headers. Encrypt PDF needs isolated mode — use `npm run build && npm run e2e` (or a Vercel preview) to test encryption end-to-end.

### Useful scripts

| Script | Purpose |
|--------|---------|
| `npm run lint` | ESLint |
| `npm run check:limits` | Tiered file-size config self-check |
| `npm run check:engines` | In-memory engine smoke tests |
| `npm run build` | Production static export (+ asset copy) |
| `npm run check-links` | Every internal link in `out/` resolves |
| `npm run e2e` | Playwright against `out/` with prod headers; asserts no external requests |
| `npm run ci` | lint → limits → engines → build → check-links |
| `node scripts/capture-screenshot.mjs` | Capture fresh homepage screenshot for README (`docs/screenshot.png`) |

---

## CI / CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

1. Install dependencies  
2. Lint + unit-style checks (`check:limits`, `check:engines`)  
3. Production build  
4. Link check on `out/`  
5. Playwright e2e (Chromium)

**Install-time network requirement:** `npm install` / `npm ci` must be able to reach **`https://cdn.sheetjs.com`**. The `xlsx` dependency is the patched SheetJS build (0.20.3), which SheetJS publishes only on its own CDN, not on npm (the npm copy, 0.18.5, has unpatched high-severity advisories). This applies to local setup, GitHub Actions, and the Vercel build. If you run behind a proxy or allow-list, add that host, or mirror the tarball and change the URL in `package.json`. Because it's installed from a URL, `npm audit` can't check it; when upgrading, check the [SheetJS changelog](https://docs.sheetjs.com/docs/miscellany/changelog) and update the version in the URL by hand. The lockfile pins the tarball's integrity hash.

**Deploy:** Vercel builds and hosts from this repo. Pushing to `main` triggers production deploy; PRs get preview URLs. CI is the gate for code quality; Vercel remains the host.

Set `NEXT_PUBLIC_SITE_URL` in the Vercel project once you attach a custom domain (feeds sitemap, robots, Open Graph, JSON-LD via `lib/site.ts`).

---

## Project layout

```
app/                 Home, tool routes, blog, privacy, terms
components/          Header (search + voice), upload, download, tool shell
lib/tools.ts         Tool registry (SEO, FAQ, how-to)
lib/pdf/             Validation, limits, load/render helpers
lib/p2p/             WebRTC room signaling & data transfer (P2P Share & Whiteboard)
lib/workers/         Worker entry + engines/
content/blog/        Markdown how-to posts
scripts/             copy-assets, capture-screenshot, e2e, check-links
.github/workflows/   CI
docs/                Documentation assets (screenshot.png)
```

---

## Privacy

Files are read into memory in your browser, processed there, and offered as a download. They are not uploaded to OfflinePDF servers. Passwords used for encrypt/unlock never leave the device.

- **Client-only by default:** 40 of 42 tools run with zero external network requests during processing.
- **P2P Share & Whiteboard network disclosure:** These two tools connect browsers directly via WebRTC DataChannel. The browser contacts the public PeerJS signaling service (`0.peerjs.com`) and Google STUN servers to broker the peer connection (seeing IP addresses and room IDs, never file contents or drawings). Content flows directly between browsers and is never stored on any server.
- **Error reports (opt-in per deployment):** set `NEXT_PUBLIC_SENTRY_DSN` at build time to enable. Unexpected tool failures then send tool id, error class, a scrubbed message, stack frames, page path (no query/hash) and User-Agent to Sentry via `lib/report.ts`, never file data. Max 5 reports per tab session, 50% sampled. `npm run check:report` sends hostile errors through the real Sentry client and fails if any filename/text appears in the envelope. Also set a spike/rate limit in the Sentry project settings.
- **Camera:** Scan to PDF accesses your device camera strictly in-tab with no uploads.

See `/privacy` and `/terms` on the live site for details.
