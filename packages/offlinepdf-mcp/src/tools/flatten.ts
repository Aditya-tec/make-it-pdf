import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { flattenPdf } from "offlinepdf-sdk";
import { flattenSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerFlattenTool(server: McpServer) {
  server.registerTool(
    "flatten_pdf",
    {
      title: "Flatten PDF Form Fields",
      description:
        "Flatten a PDF's fillable form fields into permanent page content, so the values can no " +
        "longer be edited. Use this after a form has been filled out and should be locked.",
      inputSchema: flattenSchema,
    },
    async ({ inputPath, outputPath }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let out;
        try {
          out = await flattenPdf(bytes);
        } catch (err) {
          throw friendlyPdfError(err, "Could not flatten this PDF");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`Flattened PDF written to ${written}`);
      })
  );
}
