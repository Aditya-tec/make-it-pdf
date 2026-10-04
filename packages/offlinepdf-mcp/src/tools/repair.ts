import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { repairPdf } from "../native/repairPdf.js";
import { repairSchema } from "../schema.js";
import { readInputFile, writeOutputFile, ToolError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerRepairTool(server: McpServer) {
  server.registerTool(
    "repair_pdf",
    {
      title: "Repair a Damaged PDF",
      description:
        "Attempt to repair a corrupted or malformed PDF using two strategies, tried in order: a " +
        "strict clean rebuild, then a lenient rebuild that skips broken objects. Reports which " +
        "strategy succeeded. Note: this server does NOT include the more aggressive structural " +
        "recovery (qpdf-based) that the OfflinePDF website offers for severely damaged files — if " +
        "both strategies here fail, the error says so explicitly rather than pretending a partial " +
        "fix is complete. Use this when a PDF won't open, appears truncated, or another tool reports " +
        'it as "could not open" or "invalid PDF".',
      inputSchema: repairSchema,
    },
    async ({ inputPath, outputPath }) =>
      guarded(async () => {
        const bytes = await readInputFile(inputPath);
        let result;
        try {
          result = await repairPdf(bytes);
        } catch (err) {
          throw new ToolError((err as Error).message);
        }
        const written = await writeOutputFile(outputPath, result.bytes);
        const note =
          result.strategy === "clean-rebuild"
            ? "Fully repaired (clean rebuild succeeded)."
            : "Partially recovered: some broken objects were skipped, so double-check the output.";
        return ok(`Repaired PDF written to ${written}\n${note}`);
      })
  );
}
