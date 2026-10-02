import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import PrivacyScannerTool from "./PrivacyScannerTool";

const tool = getTool("privacy-scanner")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <PrivacyScannerTool />
    </ToolPage>
  );
}
