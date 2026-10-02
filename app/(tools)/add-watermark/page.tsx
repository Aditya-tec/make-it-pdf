import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import WatermarkTool from "./WatermarkTool";

const tool = getTool("add-watermark")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <WatermarkTool />
    </ToolPage>
  );
}
