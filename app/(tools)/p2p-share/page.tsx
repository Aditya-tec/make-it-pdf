import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import P2PShareTool from "./P2PShareTool";

const tool = getTool("p2p-share")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><P2PShareTool /></ToolPage>;
}
