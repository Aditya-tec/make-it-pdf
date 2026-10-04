// Copies bundled OCR language data and PDF standard fonts into dist/ after tsup builds
// src/index.ts, same way the root package copies assets into public/ for the website.
import { cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
await cp(path.join(root, "src/assets"), path.join(root, "dist/assets"), { recursive: true });
console.log("offlinepdf-mcp: copied src/assets -> dist/assets");
