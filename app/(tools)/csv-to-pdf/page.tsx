import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import CsvToPdfTool from "./CsvToPdfTool";

const tool = getTool("csv-to-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return <ToolPage tool={tool}><CsvToPdfTool /></ToolPage>;
}
