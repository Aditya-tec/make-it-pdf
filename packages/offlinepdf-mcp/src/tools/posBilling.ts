import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { posBilling } from "../native/posBilling.js";
import { posBillingSchema } from "../schema.js";
import { writeOutputFile, ToolError } from "../fileIO.js";
import { guarded, ok } from "../respond.js";

export function registerPosBillingTool(server: McpServer) {
  server.registerTool(
    "generate_pos_receipt",
    {
      title: "Generate a POS/GST Receipt PDF",
      description:
        "Generate a point-of-sale style receipt PDF from a cart of line items, with simplified Indian " +
        "GST math (CGST/SGST split, or a single IGST line for inter-state sales). Formats for thermal " +
        "printers (80mm/58mm) or A4. This is a simplified receipt, NOT a compliant GST tax invoice — " +
        "no HSN codes, no cess, one GST rate per line. Use this when the user wants a quick sales " +
        "receipt or bill, not a legal tax document.",
      inputSchema: posBillingSchema,
    },
    async ({ outputPath, items, inclusive, interState, width, shop, receiptNo }) =>
      guarded(async () => {
        let bytes;
        try {
          bytes = await posBilling({ items, inclusive, interState, width, shop, receiptNo });
        } catch (err) {
          throw new ToolError((err as Error).message);
        }
        const written = await writeOutputFile(outputPath, bytes);
        return ok(`Receipt PDF written to ${written}`);
      })
  );
}
