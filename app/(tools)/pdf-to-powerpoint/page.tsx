import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import SimpleTool from "@/components/tool-shell/SimpleTool";

const tool = getTool("pdf-to-powerpoint")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return (
    <ToolPage tool={tool}>
      <SimpleTool
        tool="pdf-to-powerpoint"
        accept=".pdf"
        button="Convert to PowerPoint"
        needsCanvas
        intro={<><strong>Image-based slides.</strong> Each page becomes one picture on a slide. The text is not editable in PowerPoint. For editable text, use PDF to Word.</>}
      />
    </ToolPage>
  );
}
