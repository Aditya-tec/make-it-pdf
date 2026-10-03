import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import SimpleTool from "@/components/tool-shell/SimpleTool";

const tool = getTool("powerpoint-to-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return (
    <ToolPage tool={tool}>
      <SimpleTool
        tool="powerpoint-to-pdf"
        accept=".pptx"
        button="Convert to PDF"
        intro="Text and images are kept, one slide per page. Exact positioning is approximate; animations, charts, SmartArt, and some image types (EMF, SVG) are left out. Only .pptx is supported."
        print={{
          frameTitle: "PowerPoint to PDF preview",
          note: "Slides are rebuilt from the file's text and images. Expect differences from PowerPoint on complex layouts. Choose Landscape in the print dialog if it isn't already.",
          extraCss: "body{margin:0}@page{size:A4 landscape;margin:1.5cm}",
        }}
      />
    </ToolPage>
  );
}
