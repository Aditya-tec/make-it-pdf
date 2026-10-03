import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import WhiteboardTool from "./WhiteboardTool";

const tool = getTool("whiteboard")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><WhiteboardTool /></ToolPage>;
}
