// Run after `npm run build`: node scripts/check-links.mjs
// Fails if any internal href in out/**/*.html points at a page/file that wasn't exported.
import fs from "node:fs";
import path from "node:path";

const OUT = "out";
const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
const exists = (p) => isFile(path.join(OUT, p)) || isFile(path.join(OUT, p, "index.html"));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

let pages = 0, links = 0;
const broken = [];
for (const file of walk(OUT).filter((f) => f.endsWith(".html"))) {
  pages++;
  for (const [, href] of fs.readFileSync(file, "utf8").matchAll(/href="(\/[^"#?]*)/g)) {
    links++;
    if (!exists(decodeURIComponent(href))) broken.push(`${file} -> ${href}`);
  }
}
console.log(`${pages} pages, ${links} internal links checked`);
if (broken.length) { console.error("BROKEN:\n" + [...new Set(broken)].join("\n")); process.exit(1); }
