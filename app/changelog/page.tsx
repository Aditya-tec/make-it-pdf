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

      <h2>SDK package — offlinepdf-sdk (2026-10-03 to 2026-10-04)</h2>
      <p>
        A subset of the browser-worker engines, extracted into a standalone npm package with only{" "}
        <code>pdf-lib</code> and <code>fflate</code> as dependencies — zero native binaries, zero
        WASM, runs the same in Node and the browser. Lives in this repo as an npm workspace; the
        website&apos;s own worker engines for every extracted tool import directly from it, so
        there&apos;s one source of truth. Versioned independently of the website (currently 0.x,
        since the API may still evolve). See the{" "}
        <a href="https://www.npmjs.com/package/offlinepdf-sdk" target="_blank" rel="noopener noreferrer">
          npm package
        </a>{" "}
        or the <a href="/sdk">usage guide</a>.
      </p>
      <ul>
        <li><strong>v0.1.0</strong> — merge, split, rotate, organize pages, watermark, page
          numbers, flatten: the 7 engines with no WASM/canvas dependency at all, identified by a
          standalone scoping pass before extraction.</li>
        <li><strong>v0.1.1</strong> — added a standalone <code>LICENSE</code> file (the 0.1.0
          tarball was missing one).</li>
        <li><strong>v0.2.0</strong> — +3 functions: headers/footers, crop &amp; resize, fingerprint
          (10 total). Also shipped this guide&apos;s companion page at <a href="/sdk">/sdk</a> — a
          task-to-function decision table plus a full runnable reference, distinct from the package
          README&apos;s bare API listing.</li>
        <li><strong>v0.3.0 → v0.3.1</strong> — +2 functions: <code>scanPdfMetadata</code>/
          <code>stripPdfMetadata</code> (split from one engine per a design review, rather than kept
          as a single function with a strip flag) and <code>csvToPdf</code> (12 total). The
          byte-level metadata-strip verification — a PDF carrying hidden XMP, an embedded file, and
          a file-attachment annotation, asserting zero leftover objects in the output — was ported
          into the package&apos;s own test suite, not left only in the website&apos;s. 0.3.0
          published with a stale README paragraph from an edit that landed after that tarball was
          already packed; caught by downloading the actual published tarball rather than trusting
          the version number, then corrected in 0.3.1.</li>
      </ul>
      <p>
        Images to PDF was scoped and deliberately excluded: its JPEG/PNG path is clean{" "}
        <code>pdf-lib</code>, but the website tool also accepts WebP/GIF via browser canvas, and
        shipping a quietly narrower version under a name that implies full capability was judged
        worse than not shipping it — same reasoning as Compress and Encrypt.
      </p>

      <h2>Roadmap / Planned</h2>
      <p>
        <strong>SDK: more engines</strong> — Privacy Scanner and CSV to PDF were the two clean
        candidates from the v0.3 scoping pass; Images to PDF was scoped and excluded (above). No
        further candidates scoped yet.
      </p>
      <p>
        <strong>Extract Text in the SDK</strong> — scoped, not built. <code>pdf.js</code>&apos;s
        legacy Node build can extract text with zero DOM/canvas (verified empirically), but installs
        at roughly 35&nbsp;MB versus the SDK&apos;s current ~190&nbsp;KB, which conflicts with its
        lightweight positioning. Would ship as a separate package if it happens, not folded into the
        core.
      </p>
    </article>
  );
}
