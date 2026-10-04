import { PDFDocument } from "pdf-lib";

export type RepairStrategy = "clean-rebuild" | "partial-recovery";

export interface RepairResult {
  bytes: Uint8Array;
  strategy: RepairStrategy;
}

async function rewrite(bytes: Uint8Array, lenient: boolean): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: !lenient, ignoreEncryption: false });
  return doc.save();
}

/**
 * Attempt to repair a damaged PDF using two Node-clean pdf-lib strategies:
 * a strict clean rebuild, then a lenient rebuild that skips broken objects.
 *
 * A third, more aggressive strategy (qpdf structural recovery) exists in the
 * website version of this tool but is NOT available here — see README
 * "Not yet included" for why. If both strategies here fail, this throws a
 * clear error saying so, rather than silently giving up or pretending a
 * partial result is a full recovery.
 */
export async function repairPdf(bytes: Uint8Array): Promise<RepairResult> {
  try {
    const out = await rewrite(bytes, false);
    return { bytes: out, strategy: "clean-rebuild" };
  } catch {
    // fall through to the lenient strategy
  }

  try {
    const out = await rewrite(bytes, true);
    return { bytes: out, strategy: "partial-recovery" };
  } catch (err) {
    const message = (err as Error)?.message ?? String(err);
    throw new Error(
      "Could not repair this PDF. Both available recovery strategies (clean rebuild and " +
        "partial recovery) failed. This server doesn't include the more aggressive " +
        "qpdf-based structural recovery that the OfflinePDF website offers for severely " +
        `damaged files — see this package's README. Underlying error: ${message}`
    );
  }
}
