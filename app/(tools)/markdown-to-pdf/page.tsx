import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import MarkdownToPdfTool from "./MarkdownToPdfTool";

const tool = getTool("markdown-to-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><MarkdownToPdfTool /></ToolPage>;
}
