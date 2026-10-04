import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { splitPdf } from "offlinepdf-sdk";
import { splitSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerSplitTool(server: McpServer) {
  server.registerTool(
    "split_pdf",
    {
      title: "Split PDF",
      description:
        "Split a PDF into page ranges, or into one file per page. " +
        'With `ranges` (e.g. "1-3, 5, 7-10"), produces a single PDF containing just those pages. ' +
        "Without `ranges`, splits into one PDF per page and bundles them into a single .zip — " +
        "give outputPath a .zip extension in that case, a .pdf extension otherwise. " +
        "Use this when the user wants to extract specific pages or break a PDF apart.",
      inputSchema: splitSchema,
    },
    async ({ inputPath, outputPath, ranges }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let outputs;
        try {
          outputs = await splitPdf(bytes, { ranges });
        } catch (err) {
          throw friendlyPdfError(err, "Could not split this PDF");
        }
        const [result] = outputs;
        const written = await writeOutputFile(outputPath, result.bytes);
        return ok(`Split PDF written to ${written} (${result.name})`);
      })
  );
}
