import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mergePdfs } from "offlinepdf-sdk";
import { mergeSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerMergeTool(server: McpServer) {
  server.registerTool(
    "merge_pdfs",
    {
      title: "Merge PDFs",
      description:
        "Combine two or more PDF files into a single PDF, in the given order. " +
        "Reads each file from disk and writes the merged result to outputPath. " +
        "Use this when the user wants to join, combine, or concatenate several PDF files into one.",
      inputSchema: mergeSchema,
    },
    async ({ inputPaths, outputPath }) =>
      guarded(async () => {
        const files = await Promise.all(inputPaths.map((p: string) => readInputFile(p, `input file (${p})`)));
        let merged;
        try {
          merged = await mergePdfs(files);
        } catch (err) {
          throw friendlyPdfError(err, "Could not merge these PDFs");
        }
        const written = await writeOutputFile(outputPath, merged);
        return ok(`Merged ${inputPaths.length} PDFs into ${written}`);
      })
  );
}
