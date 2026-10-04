import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { addWatermark } from "offlinepdf-sdk";
import { watermarkSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError, ToolError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerWatermarkTool(server: McpServer) {
  server.registerTool(
    "watermark_pdf",
    {
      title: "Add Watermark to PDF",
      description:
        'Stamp a text or image watermark on every page of a PDF (e.g. "CONFIDENTIAL" or "DRAFT"). ' +
        "Use this when the user wants to mark a document as a draft, confidential, sample, or similar.",
      inputSchema: watermarkSchema,
    },
    async ({ inputPath, outputPath, text, imagePath, opacity, rotation, fontSize }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        const image = imagePath ? await readInputFile(imagePath, "watermark image") : undefined;
        let out;
        try {
          out = await addWatermark(bytes, { text, image, opacity, rotation, fontSize });
        } catch (err) {
          throw err instanceof ToolError ? err : friendlyPdfError(err, "Could not watermark this PDF");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`Watermarked PDF written to ${written}`);
      })
  );
}
