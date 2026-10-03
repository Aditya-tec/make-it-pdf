import { getTool } from "@/lib/tools";
import { toolMetadata } from "@/lib/toolMeta";
import ToolPage from "@/components/tool-shell/ToolPage";
import SimpleTool from "@/components/tool-shell/SimpleTool";

const tool = getTool("ebook-to-pdf")!;
export const metadata = toolMetadata(tool);
export default function Page() {
  return (
    <ToolPage tool={tool}>
      <SimpleTool
        tool="ebook-to-pdf"
        accept=".epub"
        button="Convert to PDF"
        intro={<><strong>EPUB only.</strong> MOBI and AZW3 are not supported. DRM-protected books are refused. Raster images are kept; fonts, custom styles, and SVG covers are not.</>}
        print={{
          frameTitle: "eBook to PDF preview",
          note: "Chapters are printed in reading order with your browser's default styling, not the book's own design.",
        }}
      />
    </ToolPage>
  );
}
