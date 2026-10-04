import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

/** A structured, LLM-readable error — never a raw stack trace. */
export class ToolError extends Error {}

export async function readInputFile(filePath: string, label = "input file"): Promise<Uint8Array> {
  if (!filePath || typeof filePath !== "string") {
    throw new ToolError(`Missing ${label} path.`);
  }
  const resolved = path.resolve(filePath);
  try {
    const buf = await readFile(resolved);
    return new Uint8Array(buf);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") throw new ToolError(`${label} not found: ${resolved}`);
    if (code === "EACCES") throw new ToolError(`Permission denied reading ${label}: ${resolved}`);
    if (code === "EISDIR") throw new ToolError(`${label} is a directory, not a file: ${resolved}`);
    throw new ToolError(`Could not read ${label} (${resolved}): ${(err as Error).message}`);
  }
}

export async function writeOutputFile(filePath: string, bytes: Uint8Array): Promise<string> {
  if (!filePath || typeof filePath !== "string") {
    throw new ToolError("Missing output file path.");
  }
  const resolved = path.resolve(filePath);
  try {
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, bytes);
    return resolved;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "EACCES") throw new ToolError(`Permission denied writing output file: ${resolved}`);
    if (code === "ENOSPC") throw new ToolError(`Not enough disk space to write output file: ${resolved}`);
    throw new ToolError(`Could not write output file (${resolved}): ${(err as Error).message}`);
  }
}

export async function assertExists(filePath: string, label = "file"): Promise<void> {
  try {
    await stat(path.resolve(filePath));
  } catch {
    throw new ToolError(`${label} not found: ${path.resolve(filePath)}`);
  }
}

/** Wrap a user-facing PDF error so pdf-lib's raw message never reaches the tool output directly. */
export function friendlyPdfError(err: unknown, context: string): ToolError {
  const message = (err as Error)?.message ?? String(err);
  if (/encrypted/i.test(message)) {
    return new ToolError(`${context}: this PDF is password-protected. This server does not include password removal (see README "Not yet included").`);
  }
  if (/invalid pdf|could not open|failed to parse/i.test(message)) {
    return new ToolError(`${context}: this file doesn't look like a valid PDF, or it's corrupted. Try the repair_pdf tool first.`);
  }
  return new ToolError(`${context}: ${message}`);
}
