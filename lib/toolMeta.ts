import type { Metadata } from "next";
import type { Tool } from "./tools";

/** Keyword-first title: brand last via root layout template `%s | OfflinePDF`. */
export function toolPageTitle(tool: Tool): string {
  return tool.name;
}

export function toolMetadata(tool: Tool): Metadata {
  const title = toolPageTitle(tool);
  return {
    title,
    description: tool.description,
    openGraph: { title, description: tool.description },
  };
}
