import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractText } from "../native/extractText.js";
import { extractTextSchema } from "../schema.js";
import { readInputFile, ToolError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerExtractTextTool(server: McpServer) {
  server.registerTool(
    "extract_pdf_text",
    {
      title: "Extract Text from PDF",
      description:
        "Extract the text content of a PDF, page by page, and return it directly in this tool's " +
        "response (no output file is written). If the PDF has no extractable text layer (a scanned " +
        "or image-only PDF), this returns a clear error telling the caller to use ocr_pdf first. " +
        "Use this to read, search, or summarize a PDF's text content.",
      inputSchema: extractTextSchema,
    },
    async ({ inputPath }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        try {
          const text = await extractText(bytes);
          return ok(text);
        } catch (err) {
          throw new ToolError((err as Error).message);
        }
      })
  );
}
