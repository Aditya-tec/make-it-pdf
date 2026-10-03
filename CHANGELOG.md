# Changelog

All notable changes to OfflinePDF are grouped here by release batch. Dates and tool
names are pulled from git history (`git log`) and the current tool registry
(`lib/tools.ts`), not reconstructed from memory.

## v0.1 — Initial MVP (2026-10-02)

Commit: `d44931b` — *feat: PDF Tools v1 — 10 tools, shared shell, worker pipeline, 10 blog posts, SEO*

10 core tools:

- Merge PDF
- Split PDF
- Compress PDF
- PDF to JPG
- Images to PDF
- Word to PDF
- Organize Pages
- Add Watermark
- Encrypt PDF
- Extract Text

Also shipped: shared tool page shell, the Web Worker processing pipeline, 10 launch
blog posts, and initial SEO setup.

## v0.2 — Security / Edit batch (2026-10-02)

Commit: `78aabaf` — *feat: add 10 tools (rotate, crop, page numbers, headers, unlock, OCR, flatten, redact, invert, privacy)*

+10 tools:

- Rotate PDF
- Crop & Resize
- Page Numbers
- Headers & Footers
- Remove Password
- OCR PDF
- Flatten PDF
- Redact PDF
- Invert Colours
- Privacy Scanner

## v0.3 — Conversions batch (2026-10-03)

Commit: `f625a9a` — *Enhance PDF tool functionality and expand toolset*

+10 tools:

- PDF to ZIP
- HTML to PDF
- Markdown to PDF
- CSV to PDF
- Excel to PDF
- Create PDF
- Compare PDFs
- Repair PDF
- PDF to Word
- PDF to EPUB

## v0.4 — Office formats + new infrastructure (2026-10-03)

Commits: `f625a9a`, `7ed08f6` — *Update README to enhance tool categorization and clarify P2P functionality*

+12 tools:

- PowerPoint to PDF
- PDF to PowerPoint
- PDF to Excel
- PDF to HTML
- eBook to PDF
- Fingerprint PDF
- POS Billing
- Scan to PDF
- P2P Share
- Collaborative Whiteboard
- Edit PDF Text
- PDF to Audio

New infrastructure: peer-to-peer signaling for P2P Share and Whiteboard (PeerJS +
Google STUN, disclosed on the privacy page), camera-based capture pipeline for Scan
to PDF, and local-storage-backed product list for POS Billing.

## v0.5 — Platform hardening (2026-10-03)

Reached 42 tools total. No new tools; this batch focused on making the existing
ones trustworthy and fast offline.

- **PWA / offline support** (`12c069d`) — hand-rolled service worker (static export
  rules out `next-pwa`): precaches pages, JS/CSS and fonts on install; qpdf/Tesseract
  WASM and model files cache in the background. P2P Share and Whiteboard are
  excluded and show an "unavailable offline" page. Adds web manifest, icons,
  offline banner, and an offline e2e test group (Merge, Compress, Encrypt with
  network cut).
- **Sentry error monitoring** (`2ad1dbc`) — `@sentry/browser`, loaded lazily and
  only when `NEXT_PUBLIC_SENTRY_DSN` is set. A `beforeSend` whitelist sends only
  tool id, error class, scrubbed message, stack frames, origin+path, and
  User-Agent — no breadcrumbs, no sessions. 50% sampling, capped at 5 reports per
  session. A `check:report` script sends hostile errors through the real client
  and fails CI on any leak.
- **Tiered file-size limits with device-memory detection** (`172d597`,
  `lib/pdf/toolLimits.ts`) — per-tool size caps that scale down on low-memory
  devices, plus low-memory warnings in the UI.
- **GEO/SEO infrastructure** — `app/llms.txt`, an explicit AI-crawler allowlist in
  `app/robots.ts` (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, anthropic-ai,
  Google-Extended, Bingbot), and Bing/Google site verification wired into layout
  metadata (`30491e4`, `e6a4240`).
- **Security audit pass**:
  - Privacy Scanner's metadata stripping became byte-level (`ea8f873`): it now
    also deletes catalog/page-level `/Metadata`, `/PieceInfo`, and
    `FileAttachment` annotation objects that `copyPages` was silently carrying
    over, instead of only clearing the top-level `pdf-lib` metadata fields.
  - Silent-failure warnings added across OCR PDF, PDF to Word, and other tools
    for unsupported characters and empty-page edge cases (`ea8f873`).
  - CSP updated to allow Sentry ingest hosts, and P2P Share gained drag-and-drop
    upload with accessible file-input handling (`7236408`).
  - Flaky/racy e2e tests fixed: offline Encrypt race (`6c33f8b`) and Scan to PDF
    service-worker interference (`49c1db2`).

## Roadmap / Planned

- **SDK package** — extract a subset of the browser-worker engines in
  `lib/workers/engines/` into a standalone, installable package for programmatic
  (Node/browser) use outside this Next.js app. Not yet built — see the scoping
  discussion for the proposed first-release engine set.
