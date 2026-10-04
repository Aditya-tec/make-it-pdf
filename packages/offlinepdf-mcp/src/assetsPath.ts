import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolved relative to this module's own location, which tsup bundles into dist/index.js —
// so this still points at the right place after build, where scripts/copy-assets.mjs has
// copied src/assets to dist/assets alongside it.
const here = path.dirname(fileURLToPath(import.meta.url));

export function assetPath(...segments: string[]): string {
  return path.join(here, "assets", ...segments);
}
