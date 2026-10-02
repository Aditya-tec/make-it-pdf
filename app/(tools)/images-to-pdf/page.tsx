import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import ImagesToPdfTool from "./ImagesToPdfTool";

const tool = getTool("images-to-pdf")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <ImagesToPdfTool />
    </ToolPage>
  );
}
