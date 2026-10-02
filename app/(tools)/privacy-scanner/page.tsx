import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import PrivacyScannerTool from "./PrivacyScannerTool";

const tool = getTool("privacy-scanner")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <PrivacyScannerTool />
    </ToolPage>
  );
}
