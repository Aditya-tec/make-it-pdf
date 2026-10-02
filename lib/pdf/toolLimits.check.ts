// ponytail: one runnable check for tiered caps. `npx tsx lib/pdf/toolLimits.check.ts`
import { getToolLimits, mbLabel, needsLowMemoryConfirm } from "./toolLimits";

const MB = 1024 * 1024;

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(getToolLimits("merge-pdf").maxFileBytes === 200 * MB, "merge should be 200MB");
assert(getToolLimits("encrypt-pdf").weight === "light", "encrypt is light");
assert(getToolLimits("compress-pdf").maxFileBytes === 100 * MB, "compress should be 100MB");
assert(getToolLimits("pdf-to-jpg").weight === "heavy", "pdf-to-jpg is heavy");
assert(getToolLimits("ocr-pdf").maxFileBytes === 50 * MB, "ocr should be 50MB");
assert(getToolLimits("unknown-tool").weight === "heavy", "unknown defaults heavy");
assert(mbLabel(100 * MB) === 100, "mbLabel");

// needsLowMemoryConfirm without deviceMemory should be false (undefined → no warn)
assert(needsLowMemoryConfirm("compress-pdf", 80 * MB) === false, "no deviceMemory → no warn");

console.log("toolLimits.check: ok");
