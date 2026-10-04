import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ToolError } from "./fileIO.js";

export function ok(text: string): CallToolResult {
  return { content: [{ type: "text", text }] };
}

export function okJson(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

export function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Run a tool handler, turning any thrown error into a structured MCP error result
 * instead of letting a raw stack trace (or an uncaught exception) reach the client. */
export async function guarded(fn: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ToolError) return errorResult(err.message);
    const message = (err as Error)?.message ?? String(err);
    return errorResult(`Unexpected error: ${message}`);
  }
}
