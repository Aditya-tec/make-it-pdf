import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fingerprintPdf } from "offlinepdf-sdk";
import { fingerprintSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError, ToolError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerFingerprintTool(server: McpServer) {
  server.registerTool(
    "fingerprint_pdf",
    {
      title: "Fingerprint PDF (Leak Deterrent)",
      description:
        "Stamp a PDF with a unique, near-invisible ID in its metadata and page text — a deterrent " +
        "against leaks, not forensic-grade tracking. A leaked copy can be matched back to who received " +
        "it. The ID is returned in this tool's response and is NOT stored anywhere else, so the caller " +
        "must record it. Printing to a new PDF, flattening, or a screenshot can remove the mark.",
      inputSchema: fingerprintSchema,
    },
    async ({ inputPath, outputPath, label, id }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let result;
        try {
          result = await fingerprintPdf(bytes, { label, id });
        } catch (err) {
          throw err instanceof ToolError ? err : friendlyPdfError(err, "Could not fingerprint this PDF");
        }
        const written = await writeOutputFile(outputPath, result.bytes);
        return ok(`Fingerprinted PDF written to ${written}\nFingerprint ID (record this — it isn't stored anywhere): ${result.id}`);
      })
  );
}
