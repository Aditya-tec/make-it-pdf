import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import PdfToJpgTool from "./PdfToJpgTool";

const tool = getTool("pdf-to-jpg")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <PdfToJpgTool />
    </ToolPage>
  );
}
