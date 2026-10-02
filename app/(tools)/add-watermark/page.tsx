import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import WatermarkTool from "./WatermarkTool";

const tool = getTool("add-watermark")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <WatermarkTool />
    </ToolPage>
  );
}
