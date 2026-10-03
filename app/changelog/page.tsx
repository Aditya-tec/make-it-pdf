import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "The release history of OfflinePDF's 42 browser-based PDF tools, grouped by batch, plus what's planned next.",
};

export default function Changelog() {
  return (
    <article className="prose paper max-w-3xl mx-4 sm:mx-8 my-12 sm:my-16 p-6 sm:p-10">
      <h1>Changelog</h1>
      <p><em>Grouped by release batch. Dates and tool names come from git history.</em></p>

      <h2>v0.1 — Initial MVP (2026-10-02)</h2>
      <p>10 core tools: Merge PDF, Split PDF, Compress PDF, PDF to JPG, Images to PDF, Word to
        PDF, Organize Pages, Add Watermark, Encrypt PDF, Extract Text.</p>
      <p>Also shipped: shared tool page shell, the Web Worker processing pipeline, 10 launch blog
        posts, and initial SEO setup.</p>

      <h2>v0.2 — Security / Edit batch (2026-10-02)</h2>
      <p>+10 tools: Rotate PDF, Crop &amp; Resize, Page Numbers, Headers &amp; Footers, Remove
        Password, OCR PDF, Flatten PDF, Redact PDF, Invert Colours, Privacy Scanner.</p>

      <h2>v0.3 — Conversions batch (2026-10-03)</h2>
      <p>+10 tools: PDF to ZIP, HTML to PDF, Markdown to PDF, CSV to PDF, Excel to PDF, Create
        PDF, Compare PDFs, Repair PDF, PDF to Word, PDF to EPUB.</p>

      <h2>v0.4 — Office formats + new infrastructure (2026-10-03)</h2>
      <p>+12 tools: PowerPoint to PDF, PDF to PowerPoint, PDF to Excel, PDF to HTML, eBook to PDF,
        Fingerprint PDF, POS Billing, Scan to PDF, P2P Share, Collaborative Whiteboard, Edit PDF
        Text, PDF to Audio.</p>
      <p>New infrastructure: peer-to-peer signaling for P2P Share and Whiteboard (disclosed on the
        privacy page), a camera-based capture pipeline for Scan to PDF, and a local-storage-backed
        product list for POS Billing.</p>

      <h2>v0.5 — Platform hardening (2026-10-03)</h2>
      <p>Reached 42 tools total. No new tools; this batch focused on making the existing ones
        trustworthy and fast offline.</p>
      <ul>
        <li><strong>PWA / offline support</strong> — a hand-rolled service worker precaches pages,
          JS/CSS and fonts, and caches the qpdf/Tesseract WASM and model files in the background.
          P2P Share and Whiteboard are excluded and show an &quot;unavailable offline&quot; page.</li>
        <li><strong>Sentry error monitoring</strong> — loaded lazily, scrubbed to tool id, error
          class, a shortened message, stack frames, origin+path, and user-agent. No file content is
          ever sent.</li>
        <li><strong>Tiered file-size limits</strong> that scale down on low-memory devices, with
          warnings in the UI.</li>
        <li><strong>GEO/SEO infrastructure</strong> — <code>llms.txt</code>, an explicit AI-crawler
          allowlist in <code>robots.ts</code>, and Bing/Google site verification.</li>
        <li><strong>Security audit pass</strong> — Privacy Scanner&apos;s metadata stripping became
          byte-level (it now also removes catalog/page-level metadata and file-attachment objects
          that were silently surviving a copy), plus silent-failure warnings added across several
          tools, a tightened CSP, and flaky e2e tests fixed.</li>
      </ul>

      <h2>Roadmap / Planned</h2>
      <p>
        <strong>SDK package</strong> — extracting a subset of the browser-worker engines into a
        standalone, installable package for programmatic use outside this site. Not yet built.
      </p>
    </article>
  );
}
