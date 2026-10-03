// Runs after `next build` (postbuild): bakes the list of exported files into out/sw.js so the service worker can precache them.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const OUT = "out";
const SKIP = /^(sw\.js|BingSiteAuth\.xml|google[^/]*\.html|_headers|_redirects)$|\.map$|^(p2p-share|whiteboard)\//; // keep online-only routes in sync with public/sw.js
const HEAVY = (rel, size) => /^(qpdf|tess)\//.test(rel) || size > 2 * 1024 * 1024;

const core = [], heavy = [], hash = createHash("sha1");
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) { walk(full); continue; }
    const rel = path.relative(OUT, full).split(path.sep).join("/");
    if (SKIP.test(rel)) continue;
    const buf = fs.readFileSync(full);
    hash.update(rel).update(buf);
    const url = "/" + rel.replace(/(^|\/)index\.html$/, "$1").split("/").map(encodeURIComponent).join("/");
    (HEAVY(rel, buf.length) ? heavy : core).push(url);
  }
})(OUT);

const sw = fs.readFileSync("public/sw.js", "utf8").replace(
  /\/\*MANIFEST\*\/[^;]*;/,
  `${JSON.stringify({ version: hash.digest("hex").slice(0, 12), core, heavy })};`
);
fs.writeFileSync(path.join(OUT, "sw.js"), sw);
console.log(`sw.js: ${core.length} core + ${heavy.length} heavy files`);
