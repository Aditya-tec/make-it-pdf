"use client";
import SimpleTool from "@/components/tool-shell/SimpleTool";

export default function PdfToHtmlTool() {
  return (
    <SimpleTool
      tool="pdf-to-html"
      accept=".pdf"
      button="Convert to HTML"
      intro="Real, selectable text positioned like the page. Images and vector graphics are not included. Scanned PDFs need OCR first."
      renderDone={(files) => (
        // The preview frame has no allow-* flags at all, and the file carries a no-script CSP of its own.
        <iframe
          title="PDF to HTML preview"
          sandbox=""
          srcDoc={new TextDecoder().decode(files[0].bytes)}
          className="w-full h-96 border border-slate-200 rounded-lg bg-white"
        />
      )}
    />
  );
}
