import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ocrPdf } from "../native/ocr.js";
import { ocrSchema } from "../schema.js";
import { readInputFile, ToolError } from "../fileIO.js";
import { guarded, okJson } from "../respond.js";

export function registerOcrTool(server: McpServer) {
  server.registerTool(
    "ocr_pdf",
    {
      title: "OCR a Scanned PDF",
      description:
        "Run optical character recognition on a scanned or image-only PDF and return the recognized " +
        "text per page, with a confidence score (0-100) for each. Runs entirely offline using a " +
        "bundled English language model — no network access, nothing uploaded. Use this when " +
        "extract_pdf_text reports no text found, or when the user explicitly wants OCR on a scan or " +
        "photo-based PDF. Can be slow for multi-page documents (seconds per page).",
      inputSchema: ocrSchema,
    },
    async ({ inputPath, lang }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        try {
          const pages = await ocrPdf(bytes, { lang });
          return okJson({ pages });
        } catch (err) {
          throw new ToolError((err as Error).message);
        }
      })
  );
}
