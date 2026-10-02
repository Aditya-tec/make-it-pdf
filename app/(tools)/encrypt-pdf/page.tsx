import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import EncryptTool from "./EncryptTool";

const tool = getTool("encrypt-pdf")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <EncryptTool />
    </ToolPage>
  );
}
