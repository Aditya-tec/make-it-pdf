import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { organizePages } from "offlinepdf-sdk";
import { organizeSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerOrganizeTool(server: McpServer) {
  server.registerTool(
    "organize_pdf_pages",
    {
      title: "Reorder, Rotate, or Delete PDF Pages",
      description:
        "Reorder, rotate, and drop pages of a PDF in one pass. `ops` is an explicit allowlist: " +
        "list every page you want in the output, in the order it should appear — any original page " +
        "not listed is deleted. To reorder or rotate without deleting anything, every original page " +
        "index must appear exactly once. Use this for page reordering, deleting specific pages, or " +
        "rotating individual pages (as opposed to rotate_pdf, which rotates every page the same way).",
      inputSchema: organizeSchema,
    },
    async ({ inputPath, outputPath, ops }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let out;
        try {
          out = await organizePages(bytes, ops);
        } catch (err) {
          throw friendlyPdfError(err, "Could not organize this PDF's pages");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`Organized PDF (${ops.length} pages kept) written to ${written}`);
      })
  );
}
