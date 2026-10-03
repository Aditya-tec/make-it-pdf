import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import PosTool from "./PosTool";

const tool = getTool("pos-billing")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><PosTool /></ToolPage>;
}
