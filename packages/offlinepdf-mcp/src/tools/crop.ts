import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { cropPdf } from "offlinepdf-sdk";
import { cropSchema } from "../schema.js";
import { readInputFile, writeOutputFile, friendlyPdfError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerCropTool(server: McpServer) {
  server.registerTool(
    "crop_pdf",
    {
      title: "Crop or Resize PDF Pages",
      description:
        "Trim page margins by percentage, or resize every page to a target page size (A4, Letter, " +
        "or the first page's size). Use this to remove excess whitespace or normalize page sizes.",
      inputSchema: cropSchema,
    },
    async ({ inputPath, outputPath, mode, marginTop, marginRight, marginBottom, marginLeft, target, fit }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let out;
        try {
          out = await cropPdf(bytes, { mode, marginTop, marginRight, marginBottom, marginLeft, target, fit });
        } catch (err) {
          throw friendlyPdfError(err, "Could not crop/resize this PDF");
        }
        const written = await writeOutputFile(outputPath, out);
        return ok(`Cropped/resized PDF written to ${written}`);
      })
  );
}
