import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import CropResizeTool from "./CropResizeTool";

const tool = getTool("crop-resize")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <CropResizeTool />
    </ToolPage>
  );
}
