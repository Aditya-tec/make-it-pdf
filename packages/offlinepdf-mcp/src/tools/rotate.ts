import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { rotatePdf } from "offlinepdf-sdk";
import { rotateSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerRotateTool(server: McpServer) {
  server.registerTool(
    "rotate_pdf",
    {
      title: "Rotate PDF",
      description:
        "Rotate every page of a PDF clockwise by 90, 180, or 270 degrees. " +
        "Use this when a scanned or photographed PDF is sideways or upside down.",
      inputSchema: rotateSchema,
    },
    async ({ inputPath, outputPath, angle }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let out;
        try {
          out = await rotatePdf(bytes, angle);
        } catch (err) {
          throw friendlyPdfError(err, "Could not rotate this PDF");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`Rotated PDF (${angle}°) written to ${written}`);
      })
  );
}
