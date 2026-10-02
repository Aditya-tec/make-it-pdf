import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import ExtractTextTool from "./ExtractTextTool";

const tool = getTool("extract-text")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <ExtractTextTool />
    </ToolPage>
  );
}
