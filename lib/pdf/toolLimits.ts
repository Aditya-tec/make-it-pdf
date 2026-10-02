// Per-tool size caps. One place to edit when a tool's weight changes.
// Light = byte/page ops (pdf-lib / qpdf). Heavy = canvas / decode. OCR = heaviest.

const MB = 1024 * 1024;

export type ToolWeight = "light" | "heavy" | "ocr";

type Caps = { maxFileBytes: number; maxTotalBytes: number };

const CAPS: Record<ToolWeight, Caps> = {
  light: { maxFileBytes: 300 * MB, maxTotalBytes: 600 * MB },
  heavy: { maxFileBytes: 150 * MB, maxTotalBytes: 250 * MB },
  ocr: { maxFileBytes: 75 * MB, maxTotalBytes: 75 * MB },
};

/** Default when a slug is missing — stay conservative (heavy). */
const DEFAULT_WEIGHT: ToolWeight = "heavy";

const TOOL_WEIGHT: Record<string, ToolWeight> = {
  "merge-pdf": "light",
  "split-pdf": "light",
  "encrypt-pdf": "light",
  "remove-password": "light",
  "add-watermark": "light",
  "page-numbers": "light",
  "headers-footers": "light",
  "flatten-pdf": "light",
  "organize-pages": "light",
  "rotate-pdf": "light",
  "crop-resize": "light",
  "extract-text": "light",
  "privacy-scanner": "light",
  "word-to-pdf": "light",

  "compress-pdf": "heavy",
  "pdf-to-jpg": "heavy",
  "images-to-pdf": "heavy",
  "redact-pdf": "heavy",
  "invert-colors": "heavy",

  "ocr-pdf": "ocr",
};

export type ToolLimits = Caps & { weight: ToolWeight };

export function getToolLimits(tool: string): ToolLimits {
  const weight = TOOL_WEIGHT[tool] ?? DEFAULT_WEIGHT;
  return { weight, ...CAPS[weight] };
}

export function mbLabel(bytes: number): number {
  return Math.round(bytes / MB);
}

/** Chrome/Android expose this; Safari/iOS usually don't. */
export function deviceMemoryGb(): number | undefined {
  if (typeof navigator === "undefined") return undefined;
  const n = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof n === "number" ? n : undefined;
}

/**
 * True when we should ask before starting. Unknown memory = no warn
 * (don't guess). Low RAM + file ≥ half the tool's total cap → warn.
 */
export function needsLowMemoryConfirm(tool: string, totalBytes: number): boolean {
  const mem = deviceMemoryGb();
  if (mem === undefined || mem > 4) return false;
  const { maxTotalBytes } = getToolLimits(tool);
  return totalBytes >= maxTotalBytes * 0.5;
}

export const OOM_USER_MESSAGE =
  "File too large to process on this device — try a smaller file or a different device.";
