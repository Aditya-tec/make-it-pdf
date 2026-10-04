#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerMergeTool } from "./tools/merge.js";
import { registerSplitTool } from "./tools/split.js";
import { registerRotateTool } from "./tools/rotate.js";
import { registerOrganizeTool } from "./tools/organize.js";
import { registerWatermarkTool } from "./tools/watermark.js";
import { registerPageNumbersTool } from "./tools/pageNumbers.js";
import { registerFlattenTool } from "./tools/flatten.js";
import { registerHeaderFooterTool } from "./tools/headerFooter.js";
import { registerCropTool } from "./tools/crop.js";
import { registerFingerprintTool } from "./tools/fingerprint.js";
import { registerScanMetadataTool } from "./tools/scanMetadata.js";
import { registerStripMetadataTool } from "./tools/stripMetadata.js";
import { registerCsvToPdfTool } from "./tools/csvToPdf.js";
import { registerExtractTextTool } from "./tools/extractText.js";
import { registerOcrTool } from "./tools/ocr.js";
import { registerRepairTool } from "./tools/repair.js";
import { registerPosBillingTool } from "./tools/posBilling.js";

// Diagnostic startup logging to stderr (never stdout — that's the MCP stdio channel).
// Temporary aid for debugging host-specific startup issues (e.g. a sandboxed launcher
// that times out waiting for the stdio handshake); safe to leave in, low volume, only
// fires once at startup. See README "Troubleshooting: slow or failed startup".
const t0 = Date.now();
const log = (msg: string) => console.error(`[offlinepdf-mcp] +${Date.now() - t0}ms ${msg}`);

process.on("uncaughtException", (err) => log(`uncaughtException: ${err?.stack ?? err}`));
process.on("unhandledRejection", (err) => log(`unhandledRejection: ${(err as Error)?.stack ?? err}`));

log("starting");

const server = new McpServer({ name: "offlinepdf-mcp", version: "0.1.0" });

// None of these touch pdfjs-dist, tesseract.js, or @napi-rs/canvas — extract_pdf_text and
// ocr_pdf (the only tools that need those) lazy-load them inside their handler, not here.
// Registering a tool only stores its schema/callback; it does no work until called.
registerMergeTool(server);
registerSplitTool(server);
registerRotateTool(server);
registerOrganizeTool(server);
registerWatermarkTool(server);
registerPageNumbersTool(server);
registerFlattenTool(server);
registerHeaderFooterTool(server);
registerCropTool(server);
registerFingerprintTool(server);
registerScanMetadataTool(server);
registerStripMetadataTool(server);
registerCsvToPdfTool(server);
registerExtractTextTool(server);
registerOcrTool(server);
registerRepairTool(server);
registerPosBillingTool(server);

log("tools registered, connecting stdio transport");

const transport = new StdioServerTransport();
await server.connect(transport);

log("connected");
