import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import PdfToWordTool from "./PdfToWordTool";

const tool = getTool("pdf-to-word")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><PdfToWordTool /></ToolPage>;
}
