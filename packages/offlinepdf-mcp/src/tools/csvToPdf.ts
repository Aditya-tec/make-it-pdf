import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { csvToPdf } from "offlinepdf-sdk";
import { csvToPdfSchema } from "../schema.js";
import { readInputFile, writeOutputFile, ToolError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerCsvToPdfTool(server: McpServer) {
  server.registerTool(
    "csv_to_pdf",
    {
      title: "Convert CSV to PDF",
      description:
        "Convert a CSV file into a paginated PDF table. The first row becomes a bold header repeated " +
        "on every page. Supports up to 20,000 rows and 40 columns. Use this when the user wants a " +
        "printable or shareable PDF version of spreadsheet-style data.",
      inputSchema: csvToPdfSchema,
    },
    async ({ inputPath, outputPath, title }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath, "CSV file");
        let out;
        try {
          out = await csvToPdf(bytes, { title });
        } catch (err) {
          throw err instanceof ToolError ? err : new ToolError(`Could not convert this CSV: ${(err as Error).message}`);
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`PDF table written to ${written}`);
      })
  );
}
