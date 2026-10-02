// Copies qpdf's WASM build into public/ so it is served from our own origin (see encryptPdf.ts).
import fs from "node:fs";

fs.mkdirSync("public/qpdf", { recursive: true });
for (const f of ["qpdf.js", "qpdf.wasm"]) fs.copyFileSync(`node_modules/qpdf-wasm/${f}`, `public/qpdf/${f}`);
