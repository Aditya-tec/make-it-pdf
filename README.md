# OfflinePDF

Privacy-first PDF tools that run entirely in your browser. Your files never leave your device — no uploads, no accounts, no watermarks.

**Live site:** hosted on [Vercel](https://vercel.com) (set `NEXT_PUBLIC_SITE_URL` to your production domain).

---

## Why OfflinePDF

Most free PDF sites upload your documents to a server. OfflinePDF does the opposite: every tool runs locally via WebAssembly and Web Workers. Close the tab and the file is gone.

- **20 tools** across merge, convert, edit, and security  
- **Tiered size limits** (light tools up to 300&nbsp;MB; heavy tools 150&nbsp;MB; OCR 75&nbsp;MB / 75 pages)  
- **Search + voice** in the header to jump to the best tool  
- **MIT licensed** — free for personal and commercial use  

---

## Tools

| Category | Tools |
|----------|--------|
| **Essentials** | [Merge](/merge-pdf), [Split](/split-pdf), [Compress](/compress-pdf) |
| **Convert** | [PDF → JPG](/pdf-to-jpg), [Images → PDF](/images-to-pdf), [Word → PDF](/word-to-pdf), [Invert Colours](/invert-colors) |
| **Edit** | [Organize](/organize-pages), [Watermark](/add-watermark), [Extract Text](/extract-text), [Rotate](/rotate-pdf), [Crop & Resize](/crop-resize), [Page Numbers](/page-numbers), [Headers & Footers](/headers-footers), [OCR](/ocr-pdf) |
| **Security** | [Encrypt](/encrypt-pdf), [Remove Password](/remove-password), [Flatten](/flatten-pdf), [Redact](/redact-pdf), [Privacy Scanner](/privacy-scanner) |

How-to guides live under `/blog`.

---

## Tech stack

| Layer | Stack |
|-------|--------|
| App | Next.js 16 (App Router, static `output: "export"`), React 19, TypeScript |
| UI | Tailwind CSS 4 |
| PDF | pdf-lib, pdf.js |
| Encrypt | qpdf-wasm (AES-256; COOP/COEP only on encrypt/unlock routes — see `vercel.json`) |
| OCR | tesseract.js (English model bundled; no CDN) |
| Word | mammoth |
| Zip | fflate |
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

---

## CI / CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request to `main`:

1. Install dependencies  
2. Lint + unit-style checks (`check:limits`, `check:engines`)  
3. Production build  
4. Link check on `out/`  
5. Playwright e2e (Chromium)

**Deploy:** Vercel builds and hosts from this repo. Pushing to `main` triggers production deploy; PRs get preview URLs. CI is the gate for code quality; Vercel remains the host.

Set `NEXT_PUBLIC_SITE_URL` in the Vercel project once you attach a custom domain (feeds sitemap, robots, Open Graph, JSON-LD via `lib/site.ts`).

---

## Project layout

```
app/                 Home, tool routes, blog, privacy, terms
components/          Header (search + voice), upload, download, tool shell
lib/tools.ts         Tool registry (SEO, FAQ, how-to)
lib/pdf/             Validation, limits, load/render helpers
lib/workers/         Worker entry + engines/
content/blog/        Markdown how-to posts
scripts/             copy-assets, e2e, check-links
.github/workflows/   CI
```

---

## Privacy

Files are read into memory in your browser, processed there, and offered as a download. They are not uploaded to OfflinePDF servers. Passwords used for encrypt/unlock never leave the device. See `/privacy` and `/terms` on the live site.

---

## License

MIT — see [LICENSE](LICENSE). Third-party runtime deps are MIT/Apache-2.0/BSD (qpdf-wasm is Apache-2.0). `sharp` (via Next.js) is build-time only and not shipped in `out/` (`images.unoptimized` is enabled).
