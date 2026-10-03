import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import PdfToAudioTool from "./PdfToAudioTool";

const tool = getTool("pdf-to-audio")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><PdfToAudioTool /></ToolPage>;
}
