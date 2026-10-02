import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import RemovePasswordTool from "./RemovePasswordTool";

const tool = getTool("remove-password")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <RemovePasswordTool />
    </ToolPage>
  );
}
