import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import OrganizeTool from "./OrganizeTool";

const tool = getTool("organize-pages")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <OrganizeTool />
    </ToolPage>
  );
}
