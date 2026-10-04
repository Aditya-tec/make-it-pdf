import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { addPageNumbers } from "offlinepdf-sdk";
import { pageNumbersSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerPageNumbersTool(server: McpServer) {
  server.registerTool(
    "add_page_numbers",
    {
      title: "Add Page Numbers",
      description:
        'Add page numbers to every page of a PDF, with a chosen format ("3", "3/10", or "Page 3") ' +
        "and position. Use this when the user wants their document numbered.",
      inputSchema: pageNumbersSchema,
    },
    async ({ inputPath, outputPath, format, start, skipFirst, position, fontSize }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let out;
        try {
          out = await addPageNumbers(bytes, { format, start, skipFirst, position, fontSize });
        } catch (err) {
          throw friendlyPdfError(err, "Could not add page numbers to this PDF");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`Numbered PDF written to ${written}`);
      })
  );
}
