# PDF Tools

Free, browser-based PDF tools. Merge, split, compress, convert, and more — all processed in the visitor's browser. No upload, no signup, no watermark.

**Live at**: [pdftools.vercel.app](https://pdftools.vercel.app) *(update with your URL after deploy)*

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
   git remote add origin https://github.com/YOUR_USERNAME/pdftool.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign up with GitHub (free Hobby plan, no card).

3. Click **"Add New → Project"** and import your GitHub repo.

4. Vercel auto-detects Next.js — click **Deploy** with no configuration changes.

5. Your site is live at `https://pdftool-yourname.vercel.app` immediately.

Every `git push` to `main` triggers an auto-deploy. Pull requests get free preview URLs.

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # verify static export
```

### Engine smoke test (no framework)
```bash
npx tsx engines.check.ts
```

## Add a custom domain (optional, later)

In the Vercel dashboard → Settings → Domains, add your domain. Vercel provides free HTTPS. You only pay the registrar (~$10–15/year).

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

MIT
