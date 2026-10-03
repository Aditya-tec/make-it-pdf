import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import CreatePdfTool from "./CreatePdfTool";

const tool = getTool("create-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><CreatePdfTool /></ToolPage>;
}
