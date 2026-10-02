# OfflinePDF

Free, browser-based PDF tools. Merge, split, compress, convert, and more — all processed in the visitor's browser. No upload, no signup, no watermark.

**Live at**: [offlinepdf.vercel.app](https://offlinepdf.vercel.app) *(update with your URL after deploy)*

## Tools (v1 — 10 shipped)

| Tool | URL |
|------|-----|
| Merge PDF | /merge-pdf |
| Split PDF | /split-pdf |
| Compress PDF | /compress-pdf |
| PDF to JPG | /pdf-to-jpg |
| Images to PDF | /images-to-pdf |
| Word to PDF | /word-to-pdf |
| Organize Pages | /organize-pages |
| Add Watermark | /add-watermark |
| Encrypt PDF | /encrypt-pdf |
| Extract Text | /extract-text |

## Tech stack

- **Framework**: Next.js 16 (App Router, static export)
- **Hosting**: Vercel Hobby (free, no card)
- **PDF core**: pdf-lib, pdf.js (pdfjs-dist)
- **Compression**: OffscreenCanvas + pdf-lib
- **Office**: mammoth.js (docx → HTML)
- **Encryption**: qpdf-wasm (AES-256)
- **Zip**: fflate
- **Processing**: All tools run in a Web Worker — UI thread stays responsive

## Deploy to Vercel in 5 steps (free, no card)

1. Push this repo to a free GitHub account:
   ```
   git remote add origin https://github.com/YOUR_USERNAME/offlinepdf.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign up with GitHub (free Hobby plan, no card).

3. Click **"Add New → Project"** and import your GitHub repo.

4. Vercel auto-detects Next.js — click **Deploy** with no configuration changes.

5. Your site is live at `https://offlinepdf-yourname.vercel.app` immediately.

Every `git push` to `main` triggers an auto-deploy. Pull requests get free preview URLs.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # verify static export
```

`npm run dev` doesn't send the `vercel.json` headers, so Encrypt PDF shows its "isolated mode" notice in dev. Use `npm run e2e` (serves `out/` with the real headers) to exercise it.

### Checks
```bash
npx tsx engines.check.ts          # engine smoke test, no browser
npm run build                     # also copies qpdf into public/qpdf (scripts/copy-qpdf.mjs)
npm run check-links               # every internal link in out/ resolves
npx playwright install chromium   # once
npm run e2e                       # all 10 tools in real Chromium with prod headers; asserts zero external requests
```

## Add a custom domain (optional, later)

In the Vercel dashboard → Settings → Domains, add your domain. Vercel provides free HTTPS. You only pay the registrar (~$10–15/year).

**Then set `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`** (Settings → Environment Variables) and redeploy. It feeds `sitemap.xml`, `robots.txt`, JSON-LD and `metadataBase` (via `lib/site.ts`). If unset, those keep pointing at the `*.vercel.app` host (Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, else `offlinepdf.vercel.app`), so search engines index the wrong domain. Nothing crashes.

## Project structure

```
app/
  (tools)/           # 10 tool pages
  blog/[slug]/       # 10 how-to guides
  layout.tsx         # global shell
  page.tsx           # homepage
components/
  upload/            # UploadZone
  download/          # DownloadResult
  preview/           # PageGrid (thumbnails)
  tool-shell/        # ToolPage + ToolShell wrapper
lib/
  workers/
    pdf.worker.ts    # single Web Worker entry
    engines/         # one file per tool
  pdf/               # load helpers + render (client)
  tools.ts           # tool registry
  blog.ts            # blog post loader
  jsonld.ts          # FAQ/HowTo schema
content/blog/        # 10 .md how-to posts
```

## Roadmap (Phase 2+)

- OCR (Tesseract.js)
- AI: Chat with PDF, Summarizer (Gemini free tier — text only, file never uploaded)
- More convert tools: PDF↔Markdown, PDF↔Excel, PDF↔HTML
- Rotate/crop/resize pages
- Remove password, Redact, Metadata scanner
- Scan to PDF (camera), P2P share

## License

MIT — see [LICENSE](LICENSE). Shipped third-party code is MIT/Apache-2.0/BSD (qpdf-wasm is Apache-2.0).
`sharp` (LGPL, pulled in by Next.js for image optimization) is build-time only and never in `out/`, since `images.unoptimized` is on.
