import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import SimpleTool from "@/components/tool-shell/SimpleTool";

const tool = getTool("pdf-to-excel")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return (
    <ToolPage tool={tool}>
      <SimpleTool
        tool="pdf-to-excel"
        accept=".pdf"
        button="Convert to Excel"
        intro={<><strong>Best effort.</strong> Columns are guessed from where text lines up, one sheet per page. Clean grid-style tables work best; merged cells and irregular layouts need a manual check. Scanned PDFs need OCR first.</>}
      />
    </ToolPage>
  );
}
