/**
 * Scaffolds page.tsx + *Tool.tsx for each new tool slug.
 * Run: node scripts/scaffold-tools.mjs
 */
import fs from "node:fs";
import path from "node:path";

const tools = [
  { slug: "rotate-pdf", component: "RotateTool" },
  { slug: "crop-resize", component: "CropResizeTool" },
  { slug: "page-numbers", component: "PageNumbersTool" },
  { slug: "headers-footers", component: "HeadersFootersTool" },
  { slug: "remove-password", component: "RemovePasswordTool" },
  { slug: "ocr-pdf", component: "OcrTool" },
  { slug: "flatten-pdf", component: "FlattenTool" },
  { slug: "redact-pdf", component: "RedactTool" },
  { slug: "invert-colors", component: "InvertTool" },
  { slug: "privacy-scanner", component: "PrivacyScannerTool" },
];

for (const t of tools) {
  const dir = path.join("app/(tools)", t.slug);
  fs.mkdirSync(dir, { recursive: true });
  const page = `import type { Metadata } from "next";
import { getTool } from "@/lib/tools";
import ToolPage from "@/components/tool-shell/ToolPage";
import ${t.component} from "./${t.component}";

const tool = getTool("${t.slug}")!;

export const metadata: Metadata = {
  title: tool.name,
  description: tool.description,
  openGraph: { title: tool.name, description: tool.description },
};

export default function Page() {
  return (
    <ToolPage tool={tool}>
      <${t.component} />
    </ToolPage>
  );
}
`;
  fs.writeFileSync(path.join(dir, "page.tsx"), page);
  console.log("page", t.slug);
}
