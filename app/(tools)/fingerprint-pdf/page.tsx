import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import FingerprintTool from "./FingerprintTool";

const tool = getTool("fingerprint-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><FingerprintTool /></ToolPage>;
}
