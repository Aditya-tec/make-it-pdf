import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import PageNumbersTool from "./PageNumbersTool";

const tool = getTool("page-numbers")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <PageNumbersTool />
    </ToolPage>
  );
}
