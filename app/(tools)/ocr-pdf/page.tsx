import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import OcrTool from "./OcrTool";

const tool = getTool("ocr-pdf")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <OcrTool />
    </ToolPage>
  );
}
