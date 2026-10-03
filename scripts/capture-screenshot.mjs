import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OUT = path.join(process.cwd(), "out");
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let f = path.join(OUT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`http://127.0.0.1:${port}`);

// Wait for typewriter to finish typing "OfflinePDF"
await page.waitForTimeout(1600);

// Ensure the blinking exclamation marks are visible for the static screenshot
await page.evaluate(() => {
  for (const el of document.querySelectorAll("*")) {
    if (el.className && typeof el.className === "string" && el.className.includes("mark-blink")) {
      el.style.animation = "none";
      el.style.opacity = "1";
    }
  }
});

fs.mkdirSync(path.join(process.cwd(), "docs"), { recursive: true });
await page.screenshot({ path: path.join(process.cwd(), "docs/screenshot.png") });

await browser.close();
server.close();

console.log("Successfully captured docs/screenshot.png");
