import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import MergeTool from "./MergeTool";

const tool = getTool("merge-pdf")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <MergeTool />
    </ToolPage>
  );
}
