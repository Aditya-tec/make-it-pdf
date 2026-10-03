import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SDK",
  description:
    "offlinepdf-sdk: 12 lightweight, zero-native-dependency PDF functions extracted from OfflinePDF. Install, a decision table for which function to use, a full reference with runnable examples, and what's deliberately left out.",
};

const NPM_URL = "https://www.npmjs.com/package/offlinepdf-sdk";
const GITHUB_URL = "https://github.com/Aditya-tec/make-it-pdf/tree/main/packages/offlinepdf-sdk";

export default function Sdk() {
  return (
    <article className="prose paper max-w-3xl mx-4 sm:mx-8 my-12 sm:my-16 p-6 sm:p-10">
      <h1>offlinepdf-sdk</h1>

      <pre><code>{`npm install offlinepdf-sdk`}</code></pre>
      <pre><code>{`import { mergePdfs } from "offlinepdf-sdk";
import fs from "node:fs";

const a = fs.readFileSync("a.pdf");
const b = fs.readFileSync("b.pdf");
const merged = await mergePdfs([a, b]);
fs.writeFileSync("merged.pdf", merged);`}</code></pre>
      <p>
        That&apos;s the whole shape of the API: every function takes raw bytes (<code>Uint8Array</code>) in
        and returns raw bytes out. No file system access, no network calls, no DOM.
      </p>

      <h2>Why this exists</h2>
      <p>
        offlinepdf-sdk is extracted from OfflinePDF&apos;s own 42 browser-based PDF tools — the same logic
        that runs inside the website&apos;s Web Workers, pulled out of that wrapper and given a plain async
        API. Just <code>npm install</code> — everything it needs comes along automatically, with nothing
        native to compile, so it stays small and runs the same way in Node and in the browser.
      </p>

      <h2>Which function do I need?</h2>
      <table>
        <thead>
          <tr><th>I want to…</th><th>Use</th></tr>
        </thead>
        <tbody>
          <tr><td>Combine multiple PDFs into one</td><td><code>mergePdfs</code></td></tr>
          <tr><td>Split a PDF into separate pages or specific ranges</td><td><code>splitPdf</code></td></tr>
          <tr><td>Rotate every page 90°, 180°, or 270°</td><td><code>rotatePdf</code></td></tr>
          <tr><td>Reorder, rotate, or delete specific pages</td><td><code>organizePages</code></td></tr>
          <tr><td>Mark a document CONFIDENTIAL or DRAFT (visible)</td><td><code>addWatermark</code></td></tr>
          <tr><td>Trace a leaked copy back to who received it (invisible)</td><td><code>fingerprintPdf</code></td></tr>
          <tr><td>Add page numbers</td><td><code>addPageNumbers</code></td></tr>
          <tr><td>Add a running header/footer, with date and page count</td><td><code>addHeaderFooter</code></td></tr>
          <tr><td>Trim margins, or resize every page to A4/Letter</td><td><code>cropPdf</code></td></tr>
          <tr><td>Bake a filled-in form&apos;s values in and make it read-only</td><td><code>flattenPdf</code></td></tr>
          <tr><td>See what author/app/timestamp metadata a PDF is carrying</td><td><code>scanPdfMetadata</code></td></tr>
          <tr><td>Remove that metadata before sharing a file</td><td><code>stripPdfMetadata</code></td></tr>
          <tr><td>Turn a CSV export into a paginated PDF table</td><td><code>csvToPdf</code></td></tr>
        </tbody>
      </table>
      <p>
        This table is the gap a bare API reference leaves — the full signatures, options, and examples for
        every function below.
      </p>

      <h2>Function reference</h2>

      <h3><code>mergePdfs(files: Uint8Array[]): Promise&lt;Uint8Array&gt;</code></h3>
      <p>Merge multiple PDFs into one, in the given order.</p>
      <pre><code>{`import { mergePdfs } from "offlinepdf-sdk";
import fs from "node:fs";

const a = fs.readFileSync("a.pdf");
const b = fs.readFileSync("b.pdf");
const merged = await mergePdfs([a, b]);
fs.writeFileSync("merged.pdf", merged);`}</code></pre>

      <h3><code>splitPdf(file: Uint8Array, options?: SplitOptions): Promise&lt;{`{ name: string; bytes: Uint8Array }`}[]&gt;</code></h3>
      <p>
        Split a PDF into individual pages, or into ranges. <code>options.ranges</code> is a string like
        <code>&quot;1-3, 5, 7-10&quot;</code>; omit it to get one file per page. Returns a single file when
        the result is one PDF, or a <code>split.zip</code> entry when there are several.
      </p>
      <pre><code>{`import { splitPdf } from "offlinepdf-sdk";

// One PDF per page, zipped:
const parts = await splitPdf(file);

// A specific range, as a single PDF:
const [range] = await splitPdf(file, { ranges: "1-3, 5" });`}</code></pre>

      <h3><code>rotatePdf(file: Uint8Array, angle?: 90 | 180 | 270): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Rotate every page by the given angle. Rotation is additive — a page that&apos;s already rotated
        keeps its existing orientation and gets another turn. Defaults to 90.
      </p>
      <pre><code>{`import { rotatePdf } from "offlinepdf-sdk";

const rotated = await rotatePdf(file, 180);`}</code></pre>

      <h3><code>organizePages(file: Uint8Array, ops: PageOp[]): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Reorder, rotate, and drop pages in one pass. <code>ops</code> is an <strong>explicit allowlist</strong>:
        each entry is <code>{`{ originalIndex, rotation }`}</code>, and the output contains exactly those
        pages, in that order.
      </p>
      <blockquote>
        <p>
          <strong>This is deletion-by-omission, not a partial patch.</strong> Any page whose index
          isn&apos;t in <code>ops</code> is removed — it does not pass through unchanged. To rotate or
          reorder without deleting anything, every original page index must appear exactly once in{" "}
          <code>ops</code>.
        </p>
      </blockquote>
      <pre><code>{`import { organizePages } from "offlinepdf-sdk";

// Keep page 1 as-is, then page 3 rotated 90°. Page 2 (and anything beyond page 3) is dropped.
const out = await organizePages(file, [
  { originalIndex: 0, rotation: 0 },
  { originalIndex: 2, rotation: 90 },
]);`}</code></pre>

      <h3><code>addWatermark(file: Uint8Array, options?: WatermarkOptions): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Stamp a text or image watermark on every page. Options: <code>text</code> (default
        &quot;CONFIDENTIAL&quot;), <code>opacity</code> (0–1), <code>rotation</code> in degrees,
        <code>fontSize</code>, or an <code>image</code> (JPEG/PNG bytes) to stamp a logo instead of text.
      </p>
      <pre><code>{`import { addWatermark } from "offlinepdf-sdk";

const out = await addWatermark(file, {
  text: "CONFIDENTIAL",
  opacity: 0.3,
  rotation: 45,
  fontSize: 48,
});

// Or stamp a logo instead of text:
const withLogo = await addWatermark(file, { image: logoBytes });`}</code></pre>

      <h3><code>addPageNumbers(file: Uint8Array, options?: PageNumberOptions): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Add page numbers to every page. <code>format</code> is <code>&quot;n&quot;</code>,{" "}
        <code>&quot;n/N&quot;</code>, or <code>&quot;Page n&quot;</code>; <code>position</code> picks a
        corner; <code>skipFirst</code> skips a cover page.
      </p>
      <pre><code>{`import { addPageNumbers } from "offlinepdf-sdk";

const out = await addPageNumbers(file, {
  format: "n/N",            // "n" | "n/N" | "Page n"
  position: "bottom-right", // "bottom-center" | "bottom-left" | "bottom-right" | "top-center"
  skipFirst: true,
});`}</code></pre>

      <h3><code>addHeaderFooter(file: Uint8Array, options?: HeaderFooterOptions): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Add a header and/or footer to every page, with an optional date and page number. A
        semi-transparent white band is drawn behind the text so it stays readable on dark or
        full-bleed pages.
      </p>
      <pre><code>{`import { addHeaderFooter } from "offlinepdf-sdk";

const out = await addHeaderFooter(file, {
  header: "Q3 Report",
  footer: "Confidential",
  includePageNumber: true,
  includeDate: true,
});`}</code></pre>

      <h3><code>cropPdf(file: Uint8Array, options?: CropOptions): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Crop margins by percentage (<code>mode: &quot;margins&quot;</code>, the default), or resize every
        page to a target size (<code>mode: &quot;resize&quot;</code>, with <code>target</code> of
        &quot;a4&quot;, &quot;letter&quot;, or &quot;keep&quot;, and <code>fit</code> of
        &quot;contain&quot; or &quot;stretch&quot;).
      </p>
      <pre><code>{`import { cropPdf } from "offlinepdf-sdk";

// Trim a 5% margin on every side:
const trimmed = await cropPdf(file, {
  marginTop: 0.05, marginRight: 0.05, marginBottom: 0.05, marginLeft: 0.05,
});

// Resize every page to A4, preserving aspect ratio:
const resized = await cropPdf(file, { mode: "resize", target: "a4", fit: "contain" });`}</code></pre>

      <h3><code>fingerprintPdf(file: Uint8Array, options?: FingerprintOptions): Promise&lt;{`{ bytes: Uint8Array; id: string }`}&gt;</code></h3>
      <p>
        Stamp a PDF with a unique ID: a deterrent against leaks, not forensic-grade tracking. The ID sits
        in the metadata and as near-invisible text on every page, so a leaked copy can be matched back to
        who received it. A print-to-PDF, flatten, or screenshot can remove it.
      </p>
      <blockquote>
        <p>
          <strong>Return shape is different here.</strong> Every other function above returns bare bytes;
          this one returns <code>{`{ bytes, id }`}</code>, because the generated ID is the whole point of
          running it and isn&apos;t recoverable from the file afterward — you need to save it yourself.
        </p>
      </blockquote>
      <pre><code>{`import { fingerprintPdf } from "offlinepdf-sdk";

const { bytes, id } = await fingerprintPdf(file, { label: "sent to Acme Corp" });
console.log("fingerprint ID:", id); // write this down — it's shown once and stored nowhere`}</code></pre>

      <h3><code>flattenPdf(file: Uint8Array): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Flatten interactive form fields into static page content and strip annotations, so filled-in
        values stay visible but can no longer be edited.
      </p>
      <pre><code>{`import { flattenPdf } from "offlinepdf-sdk";

const out = await flattenPdf(file);`}</code></pre>

      <h3><code>scanPdfMetadata(file: Uint8Array): Promise&lt;{`{ findings: MetadataFinding[]; pageCount: number }`}&gt;</code></h3>
      <p>
        Scan a PDF for author, creator app, timestamps, and other metadata, without modifying
        it. Read-only — pair with <code>stripPdfMetadata</code> below once you know what&apos;s
        there.
      </p>
      <pre><code>{`import { scanPdfMetadata } from "offlinepdf-sdk";

const { findings, pageCount } = await scanPdfMetadata(file);
for (const f of findings) console.log(f.key, f.value, f.risk); // risk: "low" | "medium" | "high"`}</code></pre>

      <h3><code>stripPdfMetadata(file: Uint8Array): Promise&lt;{`{ bytes: Uint8Array; findings: MetadataFinding[] }`}&gt;</code></h3>
      <p>
        Strip the metadata <code>scanPdfMetadata</code> finds — title, author, subject,
        keywords, creator/producer app fields, creation/modification dates — plus page-level
        <code>/Metadata</code>, <code>/PieceInfo</code>, and <code>FileAttachment</code>{" "}
        annotations (and their embedded-file streams) that a naive page copy would otherwise
        silently carry over. Verified at the byte level: the test suite builds a PDF with
        hidden XMP, an embedded file, and a file-attachment annotation, runs the strip, then
        inspects every indirect object of the output to confirm nothing survives.
      </p>
      <blockquote>
        <p>
          <strong>Return shape is different here too.</strong> Like <code>fingerprintPdf</code>,
          this returns <code>{`{ bytes, findings }`}</code> rather than bare bytes, so you can
          show the caller what was removed.
        </p>
      </blockquote>
      <pre><code>{`import { stripPdfMetadata } from "offlinepdf-sdk";

const { bytes, findings } = await stripPdfMetadata(file);
console.log("removed:", findings.map((f) => f.key));`}</code></pre>

      <h3><code>csvToPdf(file: Uint8Array, options?: CsvToPdfOptions): Promise&lt;Uint8Array&gt;</code></h3>
      <p>
        Convert a CSV file into a paginated PDF table. The first row becomes a bold header
        repeated on every page; remaining rows continue onto new A4 pages instead of one
        endless page. Handles quoted fields with embedded commas. Supports up to 20,000 rows
        and 40 columns.
      </p>
      <pre><code>{`import { csvToPdf } from "offlinepdf-sdk";

const out = await csvToPdf(file, { title: "Q3 Export" });`}</code></pre>

      <h2>Limits</h2>
      <p>
        Each function enforces the same sane safety caps the website uses: PDFs over 750 pages are
        rejected, and an operation that would produce output over 750&nbsp;MB throws rather than exhausting
        memory. These aren&apos;t configurable yet.
      </p>

      <h2>Not yet included</h2>
      <p>
        This package covers 12 of OfflinePDF&apos;s 42 tools. <strong>Compress, Encrypt PDF, Remove
        Password, OCR, Images to PDF, and the other 30 tools on the website are not in this package</strong>{" "}
        — most depend on WASM binaries (qpdf for encryption) or browser-only APIs (<code>OffscreenCanvas</code>{" "}
        for image compression and format conversion) that don&apos;t belong in a lightweight,
        zero-native-dependency package. Images to PDF is a deliberate exclusion rather than an oversight:
        its JPEG/PNG path is clean, but the website tool also accepts WebP/GIF via browser canvas, and
        shipping a version with quietly narrower format support than the name implies is worse than not
        shipping it — same reasoning as Compress and Encrypt. These may ship as separate add-on packages
        later; this page and the npm README will stay honest about what&apos;s actually in the box rather
        than imply more than these 12 functions.
      </p>
      <p>
        For everything else — compress, convert, OCR, redact, and the rest — use the full site, free, no
        account, nothing uploaded.
      </p>

      <h2>Links</h2>
      <p>
        <a href={NPM_URL} target="_blank" rel="noopener noreferrer">npm package</a>
        {" · "}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">source on GitHub</a>
      </p>
    </article>
  );
}
