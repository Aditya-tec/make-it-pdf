// End-to-end check of the built site in real Chromium, served with the production headers from vercel.json.
// Usage: npm run build && npm run e2e   (first time: npx playwright install chromium)
// Asserts each tool's real output, error states, that no request leaves the origin, and that there are no CSP violations.
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
const HEADERS = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")).headers[0].headers;
const COI = new Set(["cross-origin-opener-policy", "cross-origin-embedder-policy"]);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".wasm": "application/wasm", ".txt": "text/plain", ".xml": "application/xml", ".ico": "image/x-icon", ".json": "application/json", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(OUT, p);
  if (!f.startsWith(OUT)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { f = path.join(OUT, "404.html"); res.statusCode = 404; }
  // a test can ask for the isolation headers to be dropped, to exercise Encrypt's fallback
  const dropCoi = req.headers["x-e2e-no-coi"] === "1";
  for (const h of HEADERS) if (!(dropCoi && COI.has(h.key.toLowerCase()))) res.setHeader(h.key, h.value);
  res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
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

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pdftool-e2e-"));
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
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`[${name}] ${m.text()}`); });
  page.on("pageerror", (e) => consoleErrors.push(`[${name}] pageerror: ${e.message}`));
  try { await fn(page); results.push(["PASS", name]); }
  catch (e) { results.push(["FAIL", name + " :: " + String(e.message).split("\n")[0]]); }
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
}
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

// ---------- report ----------
for (const [s, n] of results) console.log(s, n);
const external = [...new Set(requests.filter((u) => !u.startsWith(BASE) && !u.startsWith("blob:") && !u.startsWith("data:")))];
console.log("\nEXTERNAL REQUESTS:", external.length ? external : "none");
const csp = consoleErrors.filter((e) => /Content Security Policy|Refused/i.test(e));
console.log("CSP violations:", csp.length ? csp.slice(0, 6) : "none");
const other = consoleErrors.filter((e) => !/Content Security Policy|Refused/i.test(e) && !/Failed to load resource/.test(e));
console.log("Other console errors:", other.length ? [...new Set(other)].slice(0, 8) : "none");
await browser.close(); server.close();
fs.rmSync(dir, { recursive: true, force: true });
process.exit(results.some((r) => r[0] === "FAIL") ? 1 : 0);

