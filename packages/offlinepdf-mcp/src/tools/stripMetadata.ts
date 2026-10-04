import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { stripPdfMetadata } from "offlinepdf-sdk";
import { stripMetadataSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerStripMetadataTool(server: McpServer) {
  server.registerTool(
    "strip_pdf_metadata",
    {
      title: "Strip Privacy-Sensitive PDF Metadata",
      description:
        "Remove title, author, subject, keywords, creator/producer app fields, creation/modification " +
        "dates, and embedded-file attachments from a PDF. Rebuilds the PDF by copying pages into a " +
        "clean document rather than just blanking fields. Use this before sharing a PDF publicly to " +
        "avoid leaking who created it or what software was used.",
      inputSchema: stripMetadataSchema,
    },
    async ({ inputPath, outputPath }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let result;
        try {
          result = await stripPdfMetadata(bytes);
        } catch (err) {
          throw friendlyPdfError(err, "Could not strip this PDF's metadata");
        }
        const written = await writeOutputFile(outputPath, result.bytes);
        const removed = result.findings.map((f) => f.key).join(", ") || "none found";
        return ok(`Cleaned PDF written to ${written}\nRemoved: ${removed}`);
      })
  );
}
