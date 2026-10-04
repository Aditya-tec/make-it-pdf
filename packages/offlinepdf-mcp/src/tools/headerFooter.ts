import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { addHeaderFooter } from "offlinepdf-sdk";
import { headerFooterSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerHeaderFooterTool(server: McpServer) {
  server.registerTool(
    "add_header_footer",
    {
      title: "Add Header/Footer to PDF",
      description:
        "Add a header and/or footer line to every page of a PDF, with an optional date and page " +
        "number. Use this for document titles, confidentiality notices, or report headers.",
      inputSchema: headerFooterSchema,
    },
    async ({ inputPath, outputPath, header, footer, includePageNumber, includeDate, fontSize }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let out;
        try {
          out = await addHeaderFooter(bytes, { header, footer, includePageNumber, includeDate, fontSize });
        } catch (err) {
          throw friendlyPdfError(err, "Could not add a header/footer to this PDF");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`PDF with header/footer written to ${written}`);
      })
  );
}
