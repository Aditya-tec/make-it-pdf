import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import HeadersFootersTool from "./HeadersFootersTool";

const tool = getTool("headers-footers")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <HeadersFootersTool />
    </ToolPage>
  );
}
