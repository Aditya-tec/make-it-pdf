import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import PdfToEpubTool from "./PdfToEpubTool";

const tool = getTool("pdf-to-epub")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><PdfToEpubTool /></ToolPage>;
}
