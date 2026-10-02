import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import ImagesToPdfTool from "./ImagesToPdfTool";

const tool = getTool("images-to-pdf")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <ImagesToPdfTool />
    </ToolPage>
  );
}
