// End-to-end check of the built site in real Chromium, served with the production headers from vercel.json.
// Usage: npm run build && npm run e2e   (first time: npx playwright install chromium)
// Asserts each tool's real output, error states, that no request leaves the origin, and that there are no CSP violations.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomFillSync } from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { zipSync, strToU8, unzipSync } from "fflate";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = path.join(ROOT, "out");
if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error("No build found in out/. Run `npm run build` first.");
  process.exit(1);
}
const vercelBlocks = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")).headers;
const COI = new Set(["cross-origin-opener-policy", "cross-origin-embedder-policy"]);
// Catch-all security headers + COOP/COEP from the tool-specific blocks (e2e applies COI site-wide unless dropped).
const globalHeaders = vercelBlocks.find((b) => b.source === "/(.*)")?.headers ?? [];
const coiHeaders = vercelBlocks
  .flatMap((b) => b.headers)
  .filter((h, i, arr) => COI.has(h.key.toLowerCase()) && arr.findIndex((x) => x.key === h.key) === i);
// Route-scoped overrides (Scan: camera allowed; P2P/Whiteboard: CSP allows the PeerJS signaling host) sit AFTER the
// catch-all in vercel.json and win for the same header key. This mimics that; whether Vercel merges the same way is
// documented behaviour we can't verify locally.
const catchAllAt = vercelBlocks.findIndex((b) => b.source === "/(.*)");
const overrides = vercelBlocks.slice(catchAllAt + 1);
function headersFor(p) {
  const m = new Map(globalHeaders.map((h) => [h.key.toLowerCase(), h]));
  for (const b of overrides) if (new RegExp("^" + b.source + "$").test(p)) for (const h of b.headers) m.set(h.key.toLowerCase(), h);
  return [...m.values(), ...coiHeaders];
}
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".txt": "text/plain", ".xml": "application/xml", ".ico": "image/x-icon", ".json": "application/json", ".svg": "image/svg+xml" };

function send404(res) {
  const candidates = [
    path.join(OUT, "404.html"),
    path.join(OUT, "_not-found", "index.html"),
  ];
  const page = candidates.find((c) => fs.existsSync(c));
  res.statusCode = 404;
  if (!page) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<!doctype html><title>404</title><h1>Not found</h1>");
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  fs.createReadStream(page).on("error", () => {
    if (!res.headersSent) res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }).pipe(res);
}

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(OUT, p);
  // Windows: normalize for startsWith check
  if (!path.resolve(f).toLowerCase().startsWith(path.resolve(OUT).toLowerCase())) {
    res.statusCode = 403;
    return res.end();
  }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  // a test can ask for the isolation headers to be dropped, to exercise Encrypt's fallback
  const dropCoi = req.headers["x-e2e-no-coi"] === "1";
  for (const h of headersFor(p)) if (!(dropCoi && COI.has(h.key.toLowerCase()))) res.setHeader(h.key, h.value);
  if (!fs.existsSync(f)) return send404(res);
  res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).on("error", () => send404(res)).pipe(res);
});
await new Promise((r) => server.listen(Number(process.env.E2E_PORT) || 0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---------- fixtures ----------
async function pdf(n, tag = "Test") {
  const d = await PDFDocument.create();
  const font = await d.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < n; i++) d.addPage([400, 500]).drawText(`${tag} page ${i + 1}`, { x: 40, y: 400, font });
  return Buffer.from(await d.save());
}
let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.error("Could not launch Chromium. Run `npx playwright install chromium` once.\n" + e.message.split("\n")[0]);
  process.exit(1);
}
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 375, height: 800 } });
const requests = [];
const consoleErrors = [];
ctx.on("request", (r) => requests.push(r.url()));

const scratch = await ctx.newPage();
await scratch.goto(BASE + "/");
const b64 = async (type) => Buffer.from(await scratch.evaluate(async (t) => {
  const c = document.createElement("canvas"); c.width = 1200; c.height = 900;
  const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 1200, 900);
  gr.addColorStop(0, "#f00"); gr.addColorStop(1, "#00f"); g.fillStyle = gr; g.fillRect(0, 0, 1200, 900);
  for (let i = 0; i < 4000; i++) { g.fillStyle = `hsl(${Math.random() * 360},80%,50%)`; g.fillRect(Math.random() * 1200, Math.random() * 900, 8, 8); }
  const blob = await new Promise((r) => c.toBlob(r, t, 0.95));
  const buf = new Uint8Array(await blob.arrayBuffer()); let s = ""; for (const x of buf) s += String.fromCharCode(x); return btoa(s);
}, type), "base64");
const jpg = await b64("image/jpeg"), png = await b64("image/png"), webp = await b64("image/webp");
await scratch.close();

const imagePdf = await (async () => {
  const d = await PDFDocument.create(); const im = await d.embedJpg(jpg);
  for (let i = 0; i < 2; i++) d.addPage([600, 450]).drawImage(im, { x: 0, y: 0, width: 600, height: 450 });
  return Buffer.from(await d.save());
})();

const docx = Buffer.from(zipSync({
  "[Content_Types].xml": strToU8(`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`),
  "_rels/.rels": strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
  "word/_rels/document.xml.rels": strToU8(`<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="javascript:alert(1)" TargetMode="External"/></Relationships>`),
  "word/document.xml": strToU8(`<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:t>Hello &lt;img src=x onerror=alert(1)&gt; world</w:t></w:r></w:p><w:p><w:hyperlink r:id="rId9"><w:r><w:t>evil link</w:t></w:r></w:hyperlink></w:p></w:body></w:document>`),
}));

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "offlinepdf-e2e-"));
const F = (name, buf) => { const p = path.join(dir, name); fs.writeFileSync(p, buf); return p; };
const a = F("a.pdf", await pdf(2, "A")), b = F("b.pdf", await pdf(3, "B")), one = F("one.pdf", await pdf(1));
const imgs = { jpg: F("p.jpg", jpg), png: F("p.png", png), webp: F("p.webp", webp) };
const imgPdf = F("img.pdf", imagePdf), docxF = F("doc.docx", docx);
const exe = F("evil.pdf", Buffer.concat([Buffer.from("MZ"), Buffer.alloc(500, 1)]));
const empty = F("empty.pdf", Buffer.alloc(0));
const trunc = F("trunc.pdf", (await pdf(4)).subarray(0, 700));

// ---------- harness ----------
const results = [];
async function t(name, fn) {
  if (process.env.E2E_ONLY && !name.includes(process.env.E2E_ONLY)) return; // dev aid: E2E_ONLY="whiteboard" npm run e2e
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`[${name}] ${m.text()}`); });
  page.on("pageerror", (e) => consoleErrors.push(`[${name}] pageerror: ${e.message}`));
  try { await fn(page); results.push(["PASS", name]); }
  catch (e) { results.push(["FAIL", name + " :: " + String(e.message).split("\n").filter((l) => l.trim()).slice(0, 4).join(" | ")]); }
  finally { await page.close(); }
}
const up = (page, files) => page.setInputFiles("input[type=file]", files);
const badge = (page) => page.getByText("Processed entirely on your device");
async function download(page, nth = 0) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).nth(nth).click()]);
  return { name: dl.suggestedFilename(), buf: fs.readFileSync(await dl.path()) };
}
const done = (page) => page.getByRole("button", { name: "Download" }).first().waitFor({ timeout: 60000 });
const ERR = (page) => page.locator("p.text-red-600, p.text-red-500, [role=alert]").filter({ hasText: /\S/ }).first();
const alertText = async (page) => (await ERR(page).textContent({ timeout: 15000 }));
const errText = async (page) => (await ERR(page).textContent({ timeout: 30000 }));

// ---------- tools ----------
await t("merge: happy path (+ badge only after done)", async (p) => {
  await p.goto(BASE + "/merge-pdf/");
  if (await badge(p).count()) throw new Error("badge visible before processing");
  await up(p, [a, b]); await p.getByRole("button", { name: /Merge 2 PDFs/ }).click(); await done(p);
  if (!(await badge(p).count())) throw new Error("badge missing after done");
  const { buf } = await download(p); const n = (await PDFDocument.load(buf)).getPageCount();
  if (n !== 5) throw new Error("pages=" + n);
});
await t("merge: single file shows hint, no merge button", async (p) => {
  await p.goto(BASE + "/merge-pdf/"); await up(p, [a]);
  await p.getByText("Add at least one more PDF").waitFor();
  if (await p.getByRole("button", { name: /Merge/ }).count()) throw new Error("merge button present");
});
await t("upload: renamed .exe rejected", async (p) => { await p.goto(BASE + "/merge-pdf/"); await up(p, [exe]); const m = await alertText(p); if (!/isn't a real/.test(m)) throw new Error(m); });
await t("upload: zero-byte rejected", async (p) => { await p.goto(BASE + "/merge-pdf/"); await up(p, [empty]); const m = await alertText(p); if (!/empty/.test(m)) throw new Error(m); });
await t("upload: truncated PDF -> clear error, no hung spinner", async (p) => {
  await p.goto(BASE + "/extract-text/"); await up(p, [trunc]); await p.getByRole("button", { name: "Extract Text" }).click();
  const m = await errText(p); console.log("   truncated ->", m.slice(0, 120));
});
await t("split: all pages -> zip of 3", async (p) => {
  await p.goto(BASE + "/split-pdf/"); await up(p, [b]); await p.getByRole("button", { name: /Split all pages/ }).click(); await done(p);
  const { name, buf } = await download(p); const files = Object.keys(unzipSync(new Uint8Array(buf)));
  if (name !== "split.zip" || files.length !== 3) throw new Error(name + files);
});
await t("split: range 2-3 -> single pdf of 2", async (p) => {
  await p.goto(BASE + "/split-pdf/"); await up(p, [b]); await p.getByRole("button", { name: "Page ranges" }).click();
  await p.getByPlaceholder("1-3, 5, 7-10").fill("2-3"); await p.getByRole("button", { name: /Split all pages/ }).click(); await done(p);
  const { buf } = await download(p); if ((await PDFDocument.load(buf)).getPageCount() !== 2) throw new Error("bad count");
});
await t("compress: image PDF shrinks", async (p) => {
  await p.goto(BASE + "/compress-pdf/"); await up(p, [imgPdf]); await p.getByRole("button", { name: "Heavy" }).click(); await p.getByRole("button", { name: "Compress PDF" }).click(); await done(p);
  const { buf } = await download(p); console.log("   compress:", imagePdf.length, "->", buf.length); await PDFDocument.load(buf);
  if (buf.length >= imagePdf.length) throw new Error("did not shrink");
});
await t("pdf-to-jpg: 3 pages -> zip", async (p) => {
  await p.goto(BASE + "/pdf-to-jpg/"); await up(p, [b]); await p.getByRole("button", { name: /Convert to JPG/ }).click(); await done(p);
  const { name, buf } = await download(p); if (name !== "pages.zip" || Object.keys(unzipSync(new Uint8Array(buf))).length !== 3) throw new Error(name);
});
await t("images-to-pdf: jpg+png+webp -> 3 pages", async (p) => {
  await p.goto(BASE + "/images-to-pdf/"); await up(p, [imgs.jpg, imgs.png, imgs.webp]); await p.getByRole("button", { name: /Create PDF/ }).click(); await done(p);
  const { buf } = await download(p); if ((await PDFDocument.load(buf)).getPageCount() !== 3) throw new Error("bad count");
});
await t("word-to-pdf: sanitized + sandboxed", async (p) => {
  await p.goto(BASE + "/word-to-pdf/"); await up(p, [docxF]); await p.getByRole("button", { name: "Convert to PDF" }).click();
  const fr = p.locator("iframe[title='Word to PDF preview']"); await fr.waitFor({ timeout: 60000 });
  const src = await fr.getAttribute("srcdoc"), sb = await fr.getAttribute("sandbox");
  console.log("   srcdoc body:", src.replace(/<style>[\s\S]*<\/style>/, "").slice(-190).replace(/\n/g, " "));
  if (/javascript:|onerror/i.test(src.replace(/<style>[\s\S]*<\/style>/, "").replace(/&lt;[^]*?&gt;/g, ""))) throw new Error("unsanitized");
  if (/allow-scripts/.test(sb)) throw new Error("scripts allowed");
  if (!(await badge(p).count())) throw new Error("no badge");
});
await t("organize: delete 1 rotate 1 -> 2 pages", async (p) => {
  await p.goto(BASE + "/organize-pages/"); await up(p, [b]); await p.getByLabel(/Delete page 3/).waitFor();
  await p.getByLabel(/Delete page 3/).click(); await p.getByLabel(/Rotate page 1/).click(); await p.getByRole("button", { name: "Save PDF" }).click(); await done(p);
  const { buf } = await download(p); const d = await PDFDocument.load(buf);
  if (d.getPageCount() !== 2 || d.getPage(0).getRotation().angle !== 90) throw new Error("bad result");
});
await t("watermark: runs", async (p) => {
  await p.goto(BASE + "/add-watermark/"); await up(p, [a]); await p.getByRole("button", { name: "Apply Watermark" }).click(); await done(p);
  await PDFDocument.load((await download(p)).buf);
});
await t("watermark: non-Latin text -> readable error", async (p) => {
  await p.goto(BASE + "/add-watermark/"); await up(p, [a]); await p.locator("input[type=text]").fill("\u673a\u5bc6"); await p.getByRole("button", { name: "Apply Watermark" }).click();
  const m = await errText(p); console.log("   non-latin ->", m.slice(0, 160)); if (/^Starting|^Processing/.test(m)) throw new Error("no error shown");
});
await t("extract-text: finds text", async (p) => {
  await p.goto(BASE + "/extract-text/"); await up(p, [a]); await p.getByRole("button", { name: "Extract Text" }).click();
  await p.getByLabel("Extracted text").waitFor({ timeout: 60000 }); if (!/A page 1/.test(await p.getByLabel("Extracted text").inputValue())) throw new Error("no text");
});
await t("extract-text: image-only PDF -> scanned message", async (p) => {
  await p.goto(BASE + "/extract-text/"); await up(p, [imgPdf]); await p.getByRole("button", { name: "Extract Text" }).click(); const m = await errText(p); if (!/scanned/i.test(m)) throw new Error(m.slice(0, 200));
});
let encrypted;
await t("encrypt: produces a PDF that requires a password", async (p) => {
  await p.goto(BASE + "/encrypt-pdf/"); await up(p, [a]);
  await p.locator("input[type=password]").nth(0).fill("s3cret!"); await p.locator("input[type=password]").nth(1).fill("s3cret!");
  await p.getByRole("button", { name: "Encrypt PDF" }).click();
  await Promise.race([done(p), ERR(p).waitFor({ timeout: 60000 })]);
  if (!(await p.getByRole("button", { name: "Download" }).count())) throw new Error(await alertText(p));
  const { buf } = await download(p); encrypted = buf;
  if (!buf.includes(Buffer.from("/Encrypt"))) throw new Error("no /Encrypt in output");
});
if (encrypted) {
  const ep = F("enc.pdf", encrypted);
  await t("merge: encrypted input -> password message", async (p) => {
    await p.goto(BASE + "/merge-pdf/"); await up(p, [ep, a]); await p.getByRole("button", { name: /Merge 2 PDFs/ }).click();
    const m = await errText(p); if (!/password-protected/.test(m)) throw new Error(m.slice(0, 200));
  });
  await t("extract-text: encrypted input -> password message", async (p) => {
    await p.goto(BASE + "/extract-text/"); await up(p, [ep]); await p.getByRole("button", { name: "Extract Text" }).click();
    const m = await errText(p); if (!/password-protected/.test(m)) throw new Error(m.slice(0, 200));
  });
  await t("remove-password: unlocks with correct password", async (p) => {
    await p.goto(BASE + "/remove-password/"); await up(p, [ep]);
    await p.locator("input[type=password]").fill("s3cret!");
    await p.getByRole("button", { name: "Remove Password" }).click(); await done(p);
    const { buf } = await download(p);
    if (buf.includes(Buffer.from("/Encrypt"))) throw new Error("still encrypted");
    await PDFDocument.load(buf); // must open without password
  });
  await t("remove-password: wrong password -> clear error", async (p) => {
    await p.goto(BASE + "/remove-password/"); await up(p, [ep]);
    await p.locator("input[type=password]").fill("wrong-pass");
    await p.getByRole("button", { name: "Remove Password" }).click();
    const m = await errText(p); if (!/Wrong password|password/i.test(m)) throw new Error(m.slice(0, 200));
  });
}

await t("rotate: 90 degrees additive", async (p) => {
  await p.goto(BASE + "/rotate-pdf/"); await up(p, [a]);
  await p.getByRole("button", { name: "90°" }).click();
  await p.getByRole("button", { name: "Rotate PDF" }).click(); await done(p);
  const { buf } = await download(p);
  const doc = await PDFDocument.load(buf);
  if (doc.getPage(0).getRotation().angle !== 90) throw new Error("not rotated");
});

await t("page-numbers: adds numbers", async (p) => {
  await p.goto(BASE + "/page-numbers/"); await up(p, [b]);
  await p.getByRole("button", { name: "Add page numbers" }).click(); await done(p);
  await PDFDocument.load((await download(p)).buf);
});

await t("privacy-scanner: lists findings then strips", async (p) => {
  // PDF with author metadata
  const metaDoc = await PDFDocument.create();
  metaDoc.addPage([200, 200]).drawText("hi", { x: 20, y: 100 });
  metaDoc.setAuthor("E2E-Author-XYZ");
  metaDoc.setTitle("E2E-Title");
  const metaPath = F("meta.pdf", Buffer.from(await metaDoc.save()));
  await p.goto(BASE + "/privacy-scanner/"); await up(p, [metaPath]);
  await p.getByRole("button", { name: "Scan for metadata" }).click();
  await p.getByText("E2E-Author-XYZ").waitFor({ timeout: 30000 });
  await p.getByRole("button", { name: /Strip/ }).click(); await done(p);
  const { buf } = await download(p);
  const cleaned = await PDFDocument.load(buf);
  if (cleaned.getAuthor() === "E2E-Author-XYZ") throw new Error("author still present");
});

await t("redact: text under box cannot be extracted", async (p) => {
  const secretDoc = await PDFDocument.create();
  const font = await secretDoc.embedFont(StandardFonts.Helvetica);
  const pg = secretDoc.addPage([400, 500]);
  pg.drawText("VISIBLE", { x: 40, y: 400, size: 24, font });
  pg.drawText("SECRET99", { x: 40, y: 250, size: 24, font });
  const secretPath = F("secret.pdf", Buffer.from(await secretDoc.save()));
  await p.goto(BASE + "/redact-pdf/"); await up(p, [secretPath]);
  // Don't use img[alt=''] — the site logo also matches that.
  const img = p.locator("img.select-none").first();
  await img.waitFor({ timeout: 30000 });
  const box = await img.boundingBox();
  if (!box) throw new Error("no preview");
  // Drag over the middle of the page where SECRET99 sits (roughly mid-page)
  await img.hover({ position: { x: box.width * 0.05, y: box.height * 0.45 } });
  await p.mouse.down();
  await p.mouse.move(box.x + box.width * 0.95, box.y + box.height * 0.65, { steps: 8 });
  await p.mouse.up();
  await p.getByRole("button", { name: /Apply redaction/ }).click({ timeout: 30000 }); await done(p);
  const redactedPath = F("redacted-out.pdf", (await download(p)).buf);
  // Extract text from redacted output
  await p.goto(BASE + "/extract-text/"); await up(p, [redactedPath]);
  await p.getByRole("button", { name: "Extract Text" }).click();
  // Either scanned/empty (raster page) or text without SECRET99
  await Promise.race([
    p.getByLabel("Extracted text").waitFor({ timeout: 60000 }),
    ERR(p).waitFor({ timeout: 60000 }),
  ]);
  if (await p.getByLabel("Extracted text").count()) {
    const text = await p.getByLabel("Extracted text").inputValue();
    if (/SECRET99/.test(text)) throw new Error("secret still extractable: " + text.slice(0, 200));
  } else {
    const m = await alertText(p);
    if (!/scanned|No text|OCR/i.test(m)) throw new Error(m);
  }
});

await t("invert: runs and produces a PDF", async (p) => {
  await p.goto(BASE + "/invert-colors/"); await up(p, [one]);
  await p.getByRole("button", { name: "Convert" }).click(); await done(p);
  await PDFDocument.load((await download(p)).buf);
});

await t("new tool pages load", async (p) => {
  for (const u of [
    "/rotate-pdf/", "/crop-resize/", "/ocr-pdf/", "/flatten-pdf/", "/headers-footers/",
    "/pdf-to-zip/", "/markdown-to-pdf/", "/html-to-pdf/", "/csv-to-pdf/", "/excel-to-pdf/",
    "/compare-pdfs/", "/repair-pdf/", "/pdf-to-word/", "/create-pdf/", "/pdf-to-epub/",
  ]) {
    const r = await p.goto(BASE + u);
    if (!r || r.status() >= 400) throw new Error(u + " status " + r?.status());
    if (!(await p.locator('script[type="application/ld+json"]').count())) throw new Error(u + " missing JSON-LD");
  }
});

await t("layout at 375px: no horizontal overflow (home + tool)", async (p) => {
  for (const u of ["/", "/merge-pdf/", "/split-pdf/", "/blog/"]) {
    await p.goto(BASE + u); const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 1) throw new Error(`${u} overflows by ${o}px`);
  }
});
await t("headers present", async (p) => {
  const r = await p.goto(BASE + "/"); const h = r.headers();
  for (const k of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy"]) if (!h[k]) throw new Error("missing " + k);
});

await t("fallback: no OffscreenCanvas -> Compress & PDF-to-JPG explain instead of hanging", async () => {
  const c = await browser.newContext();
  await c.addInitScript(() => { delete globalThis.OffscreenCanvas; });
  const p = await c.newPage();
  try {
    for (const u of ["/compress-pdf/", "/pdf-to-jpg/"]) {
      await p.goto(BASE + u);
      await p.getByText("needs a newer browser").waitFor({ timeout: 10000 });
      if (await p.locator("input[type=file]").count()) throw new Error(u + " still shows the upload zone");
    }
  } finally { await c.close(); }
});
await t("fallback: no COOP/COEP -> Encrypt explains instead of failing", async () => {
  const c = await browser.newContext({ extraHTTPHeaders: { "x-e2e-no-coi": "1" } });
  const p = await c.newPage();
  try {
    await p.goto(BASE + "/encrypt-pdf/");
    await p.getByText("isolated mode").waitFor({ timeout: 10000 });
    if (await p.locator("input[type=file]").count()) throw new Error("still shows the upload zone");
  } finally { await c.close(); }
});
await t("fallback: supported browser shows the real tools", async (p) => {
  for (const u of ["/compress-pdf/", "/pdf-to-jpg/", "/encrypt-pdf/"]) {
    await p.goto(BASE + u);
    await p.locator("input[type=file]").waitFor({ state: "attached", timeout: 10000 });
  }
});

await t("pdf-to-zip: one page is still a zip", async (p) => {
  await p.goto(BASE + "/pdf-to-zip/");
  await up(p, [one]);
  await p.getByRole("button", { name: "Create ZIP" }).click();
  await done(p);
  const { name, buf } = await download(p);
  const files = Object.keys(unzipSync(new Uint8Array(buf)));
  if (name !== "pages.zip" || files.length !== 1) throw new Error(name + " " + files.join(","));
});

await t("markdown: table, code, wrap css", async (p) => {
  const md = F("readme.md", Buffer.from("# Title\n\n| Col | Val |\n| --- | --- |\n| a | 1 |\n\n```\n" + "x".repeat(180) + "\n```\n"));
  await p.goto(BASE + "/markdown-to-pdf/");
  await up(p, [md]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  const fr = p.locator("iframe[title='Markdown to PDF preview']");
  await fr.waitFor({ timeout: 60000 });
  const src = await fr.getAttribute("srcdoc");
  if (!/<table/.test(src) || !/<pre/.test(src) || !/overflow-wrap/.test(src)) throw new Error("preview missing table, code, or wrap");
  if (!(await badge(p).count())) throw new Error("no badge");
});

await t("html-to-pdf: paste strips javascript and onerror", async (p) => {
  await p.goto(BASE + "/html-to-pdf/");
  await p.locator("#html-source").fill('<p>Safe note</p><img src=x onerror=alert(1)><a href="javascript:alert(1)">click</a><img src="https://evil.example/a.png">');
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  const fr = p.locator("iframe[title='HTML to PDF preview']");
  await fr.waitFor({ timeout: 30000 });
  const body = (await fr.getAttribute("srcdoc")).replace(/<style>[\s\S]*<\/style>/, "");
  if (/javascript:|onerror|evil\.example/i.test(body)) throw new Error(body.slice(0, 500));
  if (/allow-scripts/.test(await fr.getAttribute("sandbox"))) throw new Error("scripts allowed");
  if (!/Safe note/.test(body)) throw new Error("lost text");
});

await t("html-to-pdf: uploaded file is sanitized", async (p) => {
  const f = F("page.html", Buffer.from('<html><body><p>Uploaded</p><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a></body></html>'));
  await p.goto(BASE + "/html-to-pdf/");
  await up(p, [f]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  const fr = p.locator("iframe[title='HTML to PDF preview']");
  await fr.waitFor({ timeout: 30000 });
  const body = (await fr.getAttribute("srcdoc")).replace(/<style>[\s\S]*<\/style>/, "");
  if (/javascript:|onerror/i.test(body)) throw new Error(body.slice(0, 500));
  if (!/Uploaded/.test(body)) throw new Error("lost upload text");
});

await t("csv: many rows paginate", async (p) => {
  let csv = "Name,Qty\n";
  for (let i = 0; i < 90; i++) csv += `"Item, ${i}",${i}\n`;
  await p.goto(BASE + "/csv-to-pdf/");
  await up(p, [F("rows.csv", Buffer.from(csv))]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  await done(p);
  const n = (await PDFDocument.load((await download(p)).buf)).getPageCount();
  if (n < 2) throw new Error("pages=" + n);
});

await t("excel: first sheet becomes a pdf", async (p) => {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name", "Qty"], ["A", 1], ["B", 2]]), "Data");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["OtherSheet"]]), "Other");
  const raw = Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  await p.goto(BASE + "/excel-to-pdf/");
  await p.getByText("first sheet").first().waitFor();
  await up(p, [F("book.xlsx", raw)]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  await done(p);
  await PDFDocument.load((await download(p)).buf);
});

await t("compare: synced pages, not described as AI", async (p) => {
  await p.goto(BASE + "/compare-pdfs/");
  await p.getByText("Visual diff only").waitFor();
  const inputs = p.locator("input[type=file]");
  await inputs.nth(0).setInputFiles(a);
  await inputs.nth(1).setInputFiles(b);
  await p.getByRole("checkbox", { name: "Highlight pixels that differ" }).check();
  await p.getByRole("button", { name: "Compare PDFs" }).click();
  await p.getByAltText("File A page 1").waitFor({ timeout: 60000 });
  await p.getByAltText("File B page 1").waitFor();
  await p.getByText("not an AI summary").waitFor();
  const { name, buf } = await download(p);
  const files = Object.keys(unzipSync(new Uint8Array(buf)));
  if (name !== "comparison.zip" || !files.includes("0001-a.png") || !files.includes("0001-b.png")) throw new Error(name + " " + files.join(","));
});

await t("repair: healthy pdf says rebuilt", async (p) => {
  await p.goto(BASE + "/repair-pdf/");
  await up(p, [one]);
  await p.getByRole("button", { name: "Repair PDF" }).click();
  await p.getByText("Rebuilt successfully").waitFor({ timeout: 30000 });
  const { name, buf } = await download(p);
  if (name !== "repaired.pdf") throw new Error(name);
  await PDFDocument.load(buf);
});

await t("repair: truncated file is not called a full success", async (p) => {
  await p.goto(BASE + "/repair-pdf/");
  await up(p, [trunc]);
  await p.getByRole("button", { name: "Repair PDF" }).click();
  await Promise.race([p.getByRole("status").waitFor({ timeout: 60000 }), ERR(p).waitFor({ timeout: 60000 })]);
  if (await p.getByRole("status").count()) {
    const status = await p.getByRole("status").innerText();
    if (/Rebuilt successfully/.test(status)) throw new Error("claimed full repair: " + status);
    await PDFDocument.load((await download(p)).buf);
  } else {
    const m = await alertText(p);
    if (!/damaged|recover|corrupt|PDF/i.test(m)) throw new Error(m.slice(0, 200));
  }
});

await t("pdf-to-word: docx contains the page text", async (p) => {
  await p.goto(BASE + "/pdf-to-word/");
  await up(p, [a]);
  await p.getByRole("button", { name: "Convert to Word" }).click();
  await done(p);
  const xml = Buffer.from(unzipSync(new Uint8Array((await download(p)).buf))["word/document.xml"]).toString();
  if (!/A page 1/.test(xml) && !/page 1/.test(xml)) throw new Error(xml.slice(0, 300));
});

await t("pdf-to-word: scanned pdf points at OCR", async (p) => {
  await p.goto(BASE + "/pdf-to-word/");
  await up(p, [imgPdf]);
  await p.getByRole("button", { name: "Convert to Word" }).click();
  const m = await errText(p);
  if (!/scanned/i.test(m)) throw new Error(m.slice(0, 200));
  if (!(await p.getByRole("link", { name: "Open OCR PDF tool" }).count())) throw new Error("no ocr link");
});

await t("pdf-to-epub: text becomes an epub", async (p) => {
  await p.goto(BASE + "/pdf-to-epub/");
  await up(p, [a]);
  await p.getByRole("button", { name: "Convert to EPUB" }).click();
  await done(p);
  const { name, buf } = await download(p);
  const files = unzipSync(new Uint8Array(buf));
  if (name !== "book.epub" || Buffer.from(files.mimetype).toString() !== "application/epub+zip") throw new Error(name);
  if (!/A page 1|page 1/.test(Buffer.from(files["OEBPS/text.xhtml"]).toString())) throw new Error("no text in epub");
});

await t("pdf-to-epub: scanned pdf points at OCR", async (p) => {
  await p.goto(BASE + "/pdf-to-epub/");
  await up(p, [imgPdf]);
  await p.getByRole("button", { name: "Convert to EPUB" }).click();
  const m = await errText(p);
  if (!/scanned/i.test(m)) throw new Error(m.slice(0, 200));
});

await t("create-pdf: editor reaches the print preview", async (p) => {
  await p.goto(BASE + "/create-pdf/");
  await p.getByLabel("Document").fill("Hello created pdf");
  await p.getByRole("button", { name: "Create PDF" }).click();
  const fr = p.locator("iframe[title='Create PDF preview']");
  await fr.waitFor({ timeout: 30000 });
  if (!/Hello created pdf/.test(await fr.getAttribute("srcdoc"))) throw new Error("preview missing text");
});

// ================= batch 3: Office / eBook / PDF-out conversions =================
const pageLoadNew = ["powerpoint-to-pdf", "pdf-to-powerpoint", "pdf-to-excel", "pdf-to-html", "ebook-to-pdf", "fingerprint-pdf", "pos-billing", "scan-to-pdf", "p2p-share", "whiteboard", "edit-pdf-text", "pdf-to-audio"];
await t("batch 3: pages load with JSON-LD and no badge claims beyond the truth", async (p) => {
  for (const s of pageLoadNew) {
    const r = await p.goto(`${BASE}/${s}/`);
    if (!r || r.status() >= 400) throw new Error(s + " status " + r?.status());
    if (!(await p.locator('script[type="application/ld+json"]').count())) throw new Error(s + " missing JSON-LD");
    if (!(await p.locator("h1").first().textContent())) throw new Error(s + " no h1");
  }
});

const srcdocOf = async (p, title) => {
  const fr = p.locator(`iframe[title='${title}']`);
  await fr.waitFor({ timeout: 60000 });
  if (/allow-scripts/.test((await fr.getAttribute("sandbox")) ?? "")) throw new Error("scripts allowed in preview");
  return (await fr.getAttribute("srcdoc")).replace(/<style>[\s\S]*?<\/style>/g, "");
};

// --- PowerPoint to PDF
const pptxWith = (text, extra = {}) => Buffer.from(zipSync({
  "ppt/presentation.xml": strToU8(`<p:presentation><p:sldSz cx="9144000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>`),
  "ppt/_rels/presentation.xml.rels": strToU8(`<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/></Relationships>`),
  "ppt/slides/slide1.xml": strToU8(`<p:sld><p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><a:off x="500000" y="300000"/><a:ext cx="8000000" cy="900000"/><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:sp><p:pic><a:blip r:embed="rId2"/><a:off x="500000" y="2000000"/><a:ext cx="2000000" cy="2000000"/></p:pic></p:sld>`),
  "ppt/slides/_rels/slide1.xml.rels": strToU8(`<Relationships><Relationship Id="rId2" Target="../media/image1.png"/></Relationships>`),
  "ppt/media/image1.png": new Uint8Array(png),
  ...extra,
}));
await t("pptx: text + image kept, markup in text is inert, honest copy shown", async (p) => {
  await p.goto(BASE + "/powerpoint-to-pdf/");
  if (!(await p.getByText(/exact positioning is approximate/i).count())) throw new Error("missing approximation copy");
  await up(p, [F("deck.pptx", pptxWith("Quarterly &lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;"))]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  const body = await srcdocOf(p, "PowerPoint to PDF preview");
  if (/<script|onerror=|javascript:/i.test(body.replace(/&lt;[^]*?&gt;/g, ""))) throw new Error("live markup: " + body.slice(0, 300));
  if (!/Quarterly/.test(body) || !/data:image\/png;base64/.test(body)) throw new Error("lost text or image");
});
await t("pptx: a Word file renamed .pptx gets a clear error", async (p) => {
  await p.goto(BASE + "/powerpoint-to-pdf/");
  await up(p, [F("fake.pptx", docx)]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  if (!/PowerPoint/.test(await alertText(p))) throw new Error("unclear error");
});

// --- eBook to PDF
const epubWith = (chapter, extra = {}) => Buffer.from(zipSync({
  mimetype: strToU8("application/epub+zip"),
  "META-INF/container.xml": strToU8(`<container><rootfiles><rootfile full-path="OEBPS/c.opf"/></rootfiles></container>`),
  "OEBPS/c.opf": strToU8(`<package><manifest><item id="a" href="a.xhtml"/></manifest><spine><itemref idref="a"/></spine></package>`),
  "OEBPS/a.xhtml": strToU8(`<html><body>${chapter}</body></html>`),
  ...extra,
}));
await t("epub: scripts, handlers, javascript: links and remote images are removed", async (p) => {
  await p.goto(BASE + "/ebook-to-pdf/");
  const copy = await p.locator("main, body").first().innerText();
  if (!/EPUB only/i.test(copy)) throw new Error("copy must say EPUB only");
  await up(p, [F("book.epub", epubWith(`<h1>Chapter One</h1><p>Real text</p><script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a><img src="https://evil.example/a.png"><iframe src="https://evil.example"></iframe>`))]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  const body = await srcdocOf(p, "eBook to PDF preview");
  if (/<script|onerror|javascript:|evil\.example|<iframe/i.test(body)) throw new Error(body.slice(0, 400));
  if (!/Chapter One/.test(body) || !/Real text/.test(body)) throw new Error("lost text");
});
await t("epub: DRM refused, non-epub refused", async (p) => {
  await p.goto(BASE + "/ebook-to-pdf/");
  await up(p, [F("drm.epub", epubWith("<p>x</p>", { "META-INF/encryption.xml": strToU8(`<encryption><EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes128-cbc"/></encryption>`) }))]);
  await p.getByRole("button", { name: "Convert to PDF" }).click();
  if (!/DRM/.test(await alertText(p))) throw new Error("no DRM message");
  await p.goto(BASE + "/ebook-to-pdf/");
  await up(p, [F("notbook.epub", Buffer.from("not a zip at all, long enough to pass the empty check"))]);
  if (!/real \.epub|isn't|unsupported/i.test(await alertText(p))) throw new Error("bad file accepted");
});

// --- PDF to PowerPoint
await t("pdf-to-powerpoint: valid pptx, one slide per page, says not editable", async (p) => {
  await p.goto(BASE + "/pdf-to-powerpoint/");
  if (!(await p.getByText(/not editable/i).count())) throw new Error("missing not-editable copy");
  await up(p, [a]);
  await p.getByRole("button", { name: "Convert to PowerPoint" }).click(); await done(p);
  const d = await download(p);
  const z = unzipSync(new Uint8Array(d.buf));
  const slides = Object.keys(z).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const media = Object.keys(z).filter((n) => n.startsWith("ppt/media/"));
  if (!d.name.endsWith(".pptx") || slides.length !== 2 || media.length < 2) throw new Error(`${d.name} slides=${slides.length} media=${media.length}`);
});

// --- PDF to Excel
const tablePdf = F("table.pdf", await (async () => {
  const d = await PDFDocument.create(); const f = await d.embedFont(StandardFonts.Helvetica); const pg = d.addPage([400, 300]);
  [["Item", "Qty", "Price"], ["Apple", "3", "1,200.50"], ["Pear", "12", "40"]].forEach((row, r) => row.forEach((c, i) => pg.drawText(c, { x: 40 + i * 110, y: 240 - r * 24, size: 12, font: f })));
  return Buffer.from(await d.save());
})());
await t("pdf-to-excel: table lands in cells, numbers are numbers, labelled best effort", async (p) => {
  await p.goto(BASE + "/pdf-to-excel/");
  if (!(await p.getByText(/best effort/i).count())) throw new Error("missing best-effort label");
  await up(p, [tablePdf]);
  await p.getByRole("button", { name: "Convert to Excel" }).click(); await done(p);
  const XLSX = await import("xlsx");
  const wb = XLSX.read((await download(p)).buf);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  const j = JSON.stringify(rows);
  if (!j.includes('["Item","Qty","Price"]') || !j.includes('["Apple",3,1200.5]') || !j.includes('["Pear",12,40]')) throw new Error(j);
});
await t("pdf-to-excel: scanned/blank PDF gives an OCR hint, not an empty file", async (p) => {
  await p.goto(BASE + "/pdf-to-excel/");
  await up(p, [imgPdf]);
  await p.getByRole("button", { name: "Convert to Excel" }).click();
  if (!/scanned|OCR|text/i.test(await alertText(p))) throw new Error("no hint");
});

// --- PDF to HTML
await t("pdf-to-html: output has real selectable text; preview is fully sandboxed", async (p) => {
  await p.goto(BASE + "/pdf-to-html/");
  await up(p, [one]);
  await p.getByRole("button", { name: "Convert to HTML" }).click(); await done(p);
  const fr = p.locator("iframe[title='PDF to HTML preview']");
  if ((await fr.getAttribute("sandbox")) !== "") throw new Error("sandbox must be empty (no allow-* flags)");
  const inner = p.frameLocator("iframe[title='PDF to HTML preview']");
  const span = inner.locator("span", { hasText: "Test page 1" }).first();
  await span.click({ clickCount: 3 });
  const selected = await p.frames().find((f) => f !== p.mainFrame()).evaluate(() => String(getSelection()));
  if (!/Test page 1/.test(selected)) throw new Error("selection was: " + JSON.stringify(selected));
  const html = (await download(p)).buf.toString();
  if (!/Test page 1/.test(html) || /<script|<img/i.test(html) || !/Content-Security-Policy/.test(html)) throw new Error("bad html");
});

// ================= Group 2 =================
await t("fingerprint: unique ID per run, shown once, written into the PDF", async (p) => {
  await p.goto(BASE + "/fingerprint-pdf/");
  if (!(await p.getByText(/deterrent, not forensic/i).count())) throw new Error("missing deterrent copy");
  const ids = [];
  for (let n = 0; n < 2; n++) {
    await up(p, [one]);
    await p.getByRole("button", { name: "Add fingerprint" }).click(); await done(p);
    const id = (await p.getByTestId("fingerprint-id").textContent()).match(/FP-[0-9A-F]{8}-[0-9A-Z]+/)?.[0];
    if (!id) throw new Error("no id shown");
    const out = await PDFDocument.load((await download(p)).buf);
    const info = out.context.lookup(out.context.trailerInfo.Info, (await import("pdf-lib")).PDFDict);
    if (!String(info.get((await import("pdf-lib")).PDFName.of("OfflinePDFFingerprint"))).includes(id)) throw new Error("id not in file");
    ids.push(id);
    await p.goto(BASE + "/fingerprint-pdf/");
  }
  if (ids[0] === ids[1]) throw new Error("IDs repeat");
});

await t("pos: cart total, GST maths, persistence, thermal widths, bad input", async (p) => {
  await p.goto(BASE + "/pos-billing/");
  if (!(await p.getByText(/GST is simplified/i).count())) throw new Error("missing simplified-GST copy");
  await p.getByLabel("Product name").fill("Tea");
  await p.getByLabel("Price", { exact: true }).fill("abc");
  await p.getByRole("button", { name: "Add product" }).click();
  if (!(await p.getByRole("alert").filter({ hasText: /price/i }).count())) throw new Error("bad price accepted");
  await p.getByLabel("Price", { exact: true }).fill("100");
  await p.getByRole("button", { name: "Add product" }).click();
  await p.reload();
  await p.getByRole("button", { name: "Add Tea to cart" }).click();
  await p.getByRole("button", { name: "Add Tea to cart" }).click();
  const total = await p.getByTestId("pos-total").textContent();
  if (!total.includes("Rs.236.00") || !total.includes("Rs.36.00")) throw new Error(total); // 2 x 100 + 18% = 236
  await p.getByRole("button", { name: "Make receipt" }).click(); await done(p);
  const w80 = (await PDFDocument.load((await download(p)).buf)).getPage(0).getWidth();
  if (Math.abs(w80 - 226.77) > 1) throw new Error("80mm width " + w80);
  await p.reload();
  await p.getByLabel("Receipt width").selectOption("58mm");
  await p.getByRole("button", { name: "Add Tea to cart" }).click();
  await p.getByRole("button", { name: "Make receipt" }).click(); await done(p);
  const w58 = (await PDFDocument.load((await download(p)).buf)).getPage(0).getWidth();
  if (Math.abs(w58 - 164.41) > 1) throw new Error("58mm width " + w58);
});

// ================= Group 3: camera =================
const headerOf = async (u, name) => (await (await fetch(BASE + u)).headers.get(name)) ?? "";
await t("scan: camera allowed only on its own route; others stay blocked", async () => {
  if (!/camera=\(self\)/.test(await headerOf("/scan-to-pdf/", "permissions-policy"))) throw new Error("scan route must allow camera");
  if (!/camera=\(\)/.test(await headerOf("/merge-pdf/", "permissions-policy"))) throw new Error("other routes must block camera");
});
await t("scan: no camera -> clear message + file fallback builds a PDF", async (p) => {
  await p.addInitScript(() => { Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: () => Promise.reject(new DOMException("none", "NotFoundError")) } }); });
  await p.goto(BASE + "/scan-to-pdf/");
  await p.getByRole("button", { name: "Start camera" }).click();
  if (!(await p.getByText(/No camera was found/).count())) throw new Error("no fallback message");
  await up(p, [imgs.jpg, imgs.png]);
  await p.getByRole("button", { name: /Make PDF \(2 pages\)/ }).click(); await done(p);
  if ((await PDFDocument.load((await download(p)).buf)).getPageCount() !== 2) throw new Error("pages");
});
await t("scan: permission denied -> says how to allow it", async (p) => {
  await p.addInitScript(() => { Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: () => Promise.reject(new DOMException("denied", "NotAllowedError")) } }); });
  await p.goto(BASE + "/scan-to-pdf/");
  await p.getByRole("button", { name: "Start camera" }).click();
  if (!(await p.getByText(/Camera access was blocked/).count())) throw new Error("no denial message");
});
const camBrowser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
const camRequests = [];
await t("scan: fake webcam streams, captures 2 pages, builds a 2-page PDF, camera released", async () => {
  // serviceWorkers blocked: the SW's background WASM caching starves the fake webcam and made this test flaky (~25%); offline tests cover the SW.
  const c = await camBrowser.newContext({ permissions: ["camera"], acceptDownloads: true, serviceWorkers: "block" });
  c.on("request", (r) => camRequests.push(r.url()));
  const p = await c.newPage();
  try {
    await p.goto(BASE + "/scan-to-pdf/");
    await p.getByRole("button", { name: "Start camera" }).click();
    await p.waitForFunction(() => { const v = document.querySelector("video"); return v && v.videoWidth > 0 && v.readyState >= 2; }, null, { timeout: 15000 });
    await p.getByRole("button", { name: "Capture page" }).click();
    await p.getByRole("button", { name: "Capture page" }).click();
    await p.getByRole("button", { name: /Make PDF \(2 pages\)/ }).click();
    await done(p);
    if ((await PDFDocument.load((await download(p)).buf)).getPageCount() !== 2) throw new Error("pages");
    const live = await p.evaluate(async () => (await navigator.mediaDevices.enumerateDevices()).length >= 0);
    if (!live) throw new Error("unreachable");
  } finally { await c.close(); }
});

// ================= Group 3: WebRTC (separate contexts; the ONLY tools allowed outside requests) =================
const netRequests = [];
const mkCtx = async () => {
  const c = await browser.newContext({ acceptDownloads: true });
  c.on("request", (r) => netRequests.push(r.url()));
  c.on("page", (pg) => pg.on("websocket", (ws) => netRequests.push(ws.url()))); // signaling runs over a WebSocket, which "request" doesn't report
  return c;
};
const rnd = (n) => randomFillSync(Buffer.alloc(n));

await t("p2p: disclosure shown; CSP allows the signaling host ONLY on p2p/whiteboard", async (p) => {
  await p.goto(BASE + "/p2p-share/");
  if (!(await p.getByText(/does use the network/i).count())) throw new Error("p2p page lacks network disclosure");
  await p.goto(BASE + "/whiteboard/");
  if (!(await p.getByText(/does use the network/i).count())) throw new Error("whiteboard page lacks network disclosure");
  for (const u of ["/p2p-share/", "/whiteboard/"]) {
    const csp = await headerOf(u, "content-security-policy");
    if (!/wss:\/\/0\.peerjs\.com/.test(csp) || !/ingest\.sentry\.io/.test(csp)) throw new Error(u + " CSP");
  }
  for (const u of ["/merge-pdf/", "/scan-to-pdf/", "/"]) {
    const csp = await headerOf(u, "content-security-policy");
    if (/peerjs/.test(csp)) throw new Error(u + " CSP too loose");
    if (!/ingest\.sentry\.io/.test(csp)) throw new Error(u + " CSP missing Sentry");
  }
});

await t("p2p: real transfer between two browsers is byte-identical, with progress", async () => {
  const [c1, c2] = [await mkCtx(), await mkCtx()];
  try {
    const data = rnd(3 * 1024 * 1024 + 123);
    const s = await c1.newPage();
    await s.goto(BASE + "/p2p-share/");
    await s.locator("input[type=file]").setInputFiles({ name: "blob.bin", mimeType: "application/octet-stream", buffer: data });
    await s.getByRole("button", { name: /Create link/ }).click();
    const link = await s.getByLabel("Share link").inputValue({ timeout: 30000 });
    if (!/#opdf-[0-9a-f]{32}$/.test(link)) throw new Error("link " + link);
    const r = await c2.newPage();
    await r.goto(link);
    await r.getByRole("button", { name: /Connect and receive/ }).click();
    const [dl] = await Promise.all([r.waitForEvent("download", { timeout: 60000 }), r.getByRole("link", { name: /^Save blob\.bin/ }).click({ timeout: 60000 })]);
    const got = fs.readFileSync(await dl.path());
    if (!got.equals(data)) throw new Error(`mismatch: got ${got.length} want ${data.length}`);
    if ((await r.locator("progress").getAttribute("value")) !== "100") throw new Error("progress not 100");
    await s.getByText(/^Sent\./).waitFor({ timeout: 15000 });
  } finally { await c1.close(); await c2.close(); }
});

await t("p2p: receiver leaving mid-transfer -> sender says Connection lost", async () => {
  const [c1, c2] = [await mkCtx(), await mkCtx()];
  try {
    const s = await c1.newPage();
    await s.goto(BASE + "/p2p-share/");
    await s.locator("input[type=file]").setInputFiles(F("big.bin", rnd(150 * 1024 * 1024))); // from disk: Playwright caps in-memory buffers at 50 MB
    await s.getByRole("button", { name: /Create link/ }).click();
    const link = await s.getByLabel("Share link").inputValue({ timeout: 30000 });
    const r = await c2.newPage();
    await r.goto(link);
    await r.getByRole("button", { name: /Connect and receive/ }).click();
    await r.waitForFunction(() => { const v = Number(document.querySelector("progress")?.value); return v > 0 && v < 100; }, null, { timeout: 60000 });
    await r.close();
    await s.getByText(/Connection lost/).waitFor({ timeout: 30000 });
  } finally { await c1.close(); await c2.close(); }
});

await t("p2p: link to a room nobody is in -> clear error, not a hang", async () => {
  const c = await mkCtx();
  try {
    const r = await c.newPage();
    await r.goto(BASE + "/p2p-share/#opdf-" + "0".repeat(32));
    await r.getByRole("button", { name: /Connect and receive/ }).click();
    await r.getByRole("alert").filter({ hasText: /reach the sender/ }).waitFor({ timeout: 40000 });
  } finally { await c.close(); }
});

const ink = (page) => page.evaluate(() => {
  const c = document.querySelector("canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) n++; return n;
});
const stroke = async (page, y) => {
  await page.locator("canvas").scrollIntoViewIfNeeded(); // mouse events only hit what is in the viewport
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + box.width * (0.2 + i * 0.05), box.y + box.height * (y + (i % 2) * 0.05));
  await page.mouse.up();
};
await t("whiteboard: strokes sync both ways, late joiner gets history, clear syncs, host leaving is reported", async () => {
  const [c1, c2, c3] = [await mkCtx(), await mkCtx(), await mkCtx()];
  try {
    const h = await c1.newPage();
    await h.goto(BASE + "/whiteboard/");
    await h.getByRole("button", { name: "Start a shared whiteboard" }).click();
    const link = await h.getByLabel("Share link").inputValue({ timeout: 30000 });
    const g = await c2.newPage();
    await g.goto(link);
    await g.getByRole("button", { name: "Join the whiteboard" }).click();
    await g.getByText("Connected to the host.").waitFor({ timeout: 40000 });
    await stroke(h, 0.3);
    await g.waitForFunction(() => { const c = document.querySelector("canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; for (let i = 0; i < d.length; i += 4) if (d[i] < 200) return true; return false; }, null, { timeout: 15000 });
    await stroke(g, 0.6);
    await h.waitForTimeout(1500);
    const hostInk = await ink(h), guestInk = await ink(g);
    if (!hostInk || Math.abs(hostInk - guestInk) > hostInk * 0.1) throw new Error(`host ${hostInk} guest ${guestInk}`);
    const late = await c3.newPage();
    await late.goto(link);
    await late.getByRole("button", { name: "Join the whiteboard" }).click();
    await late.getByText("Connected to the host.").waitFor({ timeout: 40000 });
    await late.waitForTimeout(2000);
    if (Math.abs((await ink(late)) - hostInk) > hostInk * 0.1) throw new Error("late joiner missing history");
    await g.getByRole("button", { name: "Clear for everyone" }).click();
    await h.waitForTimeout(1500);
    if ((await ink(h)) !== 0 || (await ink(late)) !== 0) throw new Error("clear did not sync");
    await h.close();
    await g.getByText(/Connection lost/).waitFor({ timeout: 30000 });
  } finally { await c1.close(); await c2.close(); await c3.close(); }
});

// ================= Group 4: Edit PDF Text =================
await t("edit-pdf-text: change applied; original text is STILL extractable (as the page warns)", async (p) => {
  await p.goto(BASE + "/edit-pdf-text/");
  if (!(await p.getByText(/approximation/i).count()) || !(await p.getByText(/Redact PDF/).count())) throw new Error("missing approximation / redact warning");
  await up(p, [one]);
  const box = p.getByLabel("Text: Test page 1");
  await box.waitFor({ timeout: 30000 });
  await box.fill("Edited words here");
  await p.getByRole("button", { name: "Apply 1 edit" }).click(); await done(p);
  const out = (await download(p)).buf;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(out), useSystemFonts: true }).promise;
  const text = (await (await doc.getPage(1)).getTextContent()).items.map((i) => i.str).join(" ");
  if (!text.includes("Edited words here")) throw new Error("new text missing: " + text);
  if (!text.includes("Test page 1")) throw new Error("expected the old text to remain underneath (documented limitation): " + text);
});
await t("edit-pdf-text: characters it can't draw are refused with a message", async (p) => {
  await p.goto(BASE + "/edit-pdf-text/");
  await up(p, [one]);
  const box = p.getByLabel("Text: Test page 1");
  await box.waitFor({ timeout: 30000 });
  await box.fill("\u6f22\u5b57");
  await p.getByRole("button", { name: "Apply 1 edit" }).click();
  if (!/characters/.test(await alertText(p))) throw new Error("no message");
});

// ================= Group 5: PDF to Audio (listen only) =================
await t("pdf-to-audio: prepares text; offers local voices or says none; never offers a download", async (p) => {
  await p.goto(BASE + "/pdf-to-audio/");
  if (!(await p.getByText(/no audio download/i).count())) throw new Error("must say listen-only");
  await up(p, [one]);
  await p.getByRole("button", { name: "Prepare to listen" }).click();
  await p.getByText(/Listening only/).waitFor({ timeout: 30000 });
  if (await p.getByRole("button", { name: "Download" }).count()) throw new Error("unexpected Download button");
  // Linux Chromium loads voices late and the list can change after first render, so settle on one of the two valid states.
  const noVoices = p.getByText(/No offline voices/);
  await p.locator('select[aria-label="Voice"]').or(noVoices).first().waitFor({ timeout: 10000 });
  let voices = await p.locator('select[aria-label="Voice"]').count();
  if (voices) {
    try { await p.getByRole("button", { name: "Play" }).click({ timeout: 5000 }); }
    catch (e) { if (!(await noVoices.count())) throw e; voices = 0; } // list vanished mid-test: the honest no-voices state
  }
  if (voices) {
    // a CI box may have a voice but no audio device: playback can error out at once, so Part 1 / Stop are best-effort
    await p.getByText(/Part 1 of/).waitFor({ timeout: 3000 }).catch(() => {});
    await p.getByRole("button", { name: "Stop" }).click({ timeout: 1000 }).catch(() => {});
  } else if (!(await noVoices.count())) throw new Error("neither voices nor the no-voices message");
  console.log(`  (pdf-to-audio: ${voices ? "local voices present, Play started" : "no local voices in this browser, message shown"})`);
});
await t("pdf-to-audio: browser without speech synthesis gets the unsupported message", async (p) => {
  await p.addInitScript(() => { delete window.speechSynthesis; Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true }); });
  await p.goto(BASE + "/pdf-to-audio/");
  await p.getByText(/can't read text aloud|can.t read text aloud/).waitFor({ timeout: 10000 });
});
// ================= Group 6: offline (service worker) =================
// Fresh context: visit online once so the SW installs and caches everything, then cut the network and run real jobs.
{
  const oc = await browser.newContext({ acceptDownloads: true, viewport: { width: 375, height: 800 } });
  const step = async (name, fn) => {
    const p = await oc.newPage();
    try { await fn(p); results.push(["PASS", name]); }
    catch (e) { results.push(["FAIL", name + " :: " + String(e.message).split("\n").filter((l) => l.trim()).slice(0, 4).join(" | ")]); }
    finally { await p.close(); }
  };
  await step("offline: SW installs and caches core + heavy (qpdf/tess) files", async (p) => {
    await p.goto(BASE + "/");
    // Poll from Node: page.waitForFunction does NOT await an async predicate (a pending Promise is truthy, so it returns at once).
    // Wait for EVERY heavy file; readdir order differs per OS, so on Linux CI qpdf.wasm can be cached before qpdf.js.
    const cachedAll = () => p.evaluate(async () => {
      if (!navigator.serviceWorker.controller) return false;
      const m = JSON.parse((await (await fetch("/sw.js")).text()).match(/const MANIFEST = (\{.*\});/)[1]);
      const c = await caches.open((await caches.keys())[0]);
      for (const u of m.core.concat(m.heavy)) if (!(await c.match(u))) return false;
      return m.heavy.length > 0;
    }).catch(() => false);
    for (let t = Date.now(); !(await cachedAll()); await p.waitForTimeout(500)) if (Date.now() - t > 90000) throw new Error("SW did not finish caching");
  });
  await oc.setOffline(true);
  await step("offline: banner shown; merge completes with zero network", async (p) => {
    await p.goto(BASE + "/merge-pdf/");
    await p.getByText(/You're offline/).waitFor({ timeout: 10000 });
    await up(p, [a, b]); await p.getByRole("button", { name: /Merge 2 PDFs/ }).click(); await done(p);
    if ((await PDFDocument.load((await download(p)).buf)).getPageCount() !== 5) throw new Error("bad merge");
  });
  await step("offline: compress completes with zero network", async (p) => {
    await p.goto(BASE + "/compress-pdf/"); await up(p, [imgPdf]);
    await p.getByRole("button", { name: "Compress PDF" }).click(); await done(p); await PDFDocument.load((await download(p)).buf);
  });
  await step("offline: encrypt (qpdf WASM) completes with zero network", async (p) => {
    await p.goto(BASE + "/encrypt-pdf/"); await up(p, [a]);
    await p.locator("input[type=password]").nth(0).fill("s3cret!"); await p.locator("input[type=password]").nth(1).fill("s3cret!");
    await p.getByRole("button", { name: "Encrypt PDF" }).click(); await done(p);
    if (!(await download(p)).buf.includes(Buffer.from("/Encrypt"))) throw new Error("no /Encrypt");
  });
  await step("offline: P2P Share and Whiteboard say they're unavailable instead of hanging", async (p) => {
    for (const r of ["/p2p-share/", "/whiteboard/"]) {
      await p.goto(BASE + r);
      await p.getByText(/needs a live connection/).first().waitFor({ timeout: 5000 });
    }
  });
  await oc.close();
}
await camBrowser.close();

// ---------- report ----------
for (const [s, n] of results) console.log(s, n);
const netExternal = [...new Set(netRequests.filter((u) => !u.startsWith(BASE) && !u.startsWith("blob:") && !u.startsWith("data:")))];
console.log("\nP2P/Whiteboard-only external requests (expected: PeerJS signaling):", netExternal.length ? netExternal : "none");
const camExternal = camRequests.filter((u) => !u.startsWith(BASE) && !u.startsWith("blob:") && !u.startsWith("data:"));
console.log("Scan camera session external requests:", camExternal.length ? camExternal : "none");
if (camExternal.length || netExternal.some((u) => !/^(https|wss):\/\/0\.peerjs\.com\//.test(u))) results.push(["FAIL", "unexpected external request from camera/p2p/whiteboard sessions"]);
const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("blob:") && !u.startsWith("data:")))];
console.log("\nEXTERNAL REQUESTS:", external.length ? external : "none");
const csp = consoleErrors.filter((e) => /Content Security Policy|Refused/i.test(e));
console.log("CSP violations:", csp.length ? csp.slice(0, 6) : "none");
const other = consoleErrors.filter((e) => !/Content Security Policy|Refused/i.test(e) && !/Failed to load resource/.test(e));
console.log("Other console errors:", other.length ? [...new Set(other)].slice(0, 8) : "none");
await browser.close(); server.close();
fs.rmSync(dir, { recursive: true, force: true });
process.exit(results.some((r) => r[0] === "FAIL") ? 1 : 0);

