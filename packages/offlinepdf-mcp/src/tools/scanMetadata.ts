import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { scanPdfMetadata } from "offlinepdf-sdk";
import { scanMetadataSchema } from "../schema.js";
import { readInputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, okJson } from "../respond.js";

export function registerScanMetadataTool(server: McpServer) {
  server.registerTool(
    "scan_pdf_metadata",
    {
      title: "Scan PDF for Privacy-Sensitive Metadata",
      description:
        "Scan a PDF for author, creator app, timestamps, and other metadata, without modifying it. " +
        "Returns a list of findings with a risk level (low/medium/high) for each. Use this to check " +
        "what a PDF might reveal about who made it before sharing it; follow up with strip_pdf_metadata " +
        "to remove what's found.",
      inputSchema: scanMetadataSchema,
    },
    async ({ inputPath }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        try {
          const result = await scanPdfMetadata(bytes);
          return okJson(result);
        } catch (err) {
          throw friendlyPdfError(err, "Could not scan this PDF's metadata");
        }
      })
  );
}
