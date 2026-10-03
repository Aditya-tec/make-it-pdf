import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import EditTextTool from "./EditTextTool";

const tool = getTool("edit-pdf-text")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><EditTextTool /></ToolPage>;
}
