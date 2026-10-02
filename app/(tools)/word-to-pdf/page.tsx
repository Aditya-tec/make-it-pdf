import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import WordToPdfTool from "./WordToPdfTool";

const tool = getTool("word-to-pdf")!;

export const metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <WordToPdfTool />
    </ToolPage>
  );
}
