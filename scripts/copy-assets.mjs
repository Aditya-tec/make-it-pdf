// Copies WASM/assets into public/ so they are served from our origin (privacy: no CDN).
import fs from "node:fs";
import path from "node:path";

function cp(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// qpdf (Encrypt / Remove Password)
fs.mkdirSync("public/qpdf", { recursive: true });
for (const f of ["qpdf.js", "qpdf.wasm"]) {
  cp(`node_modules/qpdf-wasm/${f}`, `public/qpdf/${f}`);
}

// tesseract.js (OCR) — worker, wasm core, English language model
fs.mkdirSync("public/tess/lang", { recursive: true });
cp("node_modules/tesseract.js/dist/worker.min.js", "public/tess/worker.min.js");
for (const f of fs.readdirSync("node_modules/tesseract.js-core")) {
  if (/\.(js|wasm)$/.test(f)) cp(`node_modules/tesseract.js-core/${f}`, `public/tess/${f}`);
}
// Prefer the smaller "best_int" model (~3 MB gzipped) for faster first load
const engSrc =
  "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";
cp(engSrc, "public/tess/lang/eng.traineddata.gz");

console.log("copied qpdf + tesseract assets into public/");
