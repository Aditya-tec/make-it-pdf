import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import ScanTool from "./ScanTool";

const tool = getTool("scan-to-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><ScanTool /></ToolPage>;
}
