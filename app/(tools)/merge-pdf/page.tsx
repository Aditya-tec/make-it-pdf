import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import MergeTool from "./MergeTool";

const tool = getTool("merge-pdf")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <MergeTool />
    </ToolPage>
  );
}
