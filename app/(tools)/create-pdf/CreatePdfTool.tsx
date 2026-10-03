"use client";
import { useRef, useState } from "react";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import HtmlPrintPreview from "@/components/HtmlPrintPreview";

export default function CreatePdfTool() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [empty, setEmpty] = useState<string | null>(null);
  const { job, run, reset } = useWorker();

  const cmd = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const create = () => {
    const html = editorRef.current?.innerHTML ?? "";
    if (!html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()) {
      setEmpty("Write something first.");
      return;
    }
    setEmpty(null);
    run({ tool: "create-pdf", files: [new TextEncoder().encode(html).buffer], options: {} });
  };

  const handleReset = () => {
    reset();
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "done") {
    return (
      <HtmlPrintPreview
        html={new TextDecoder().decode(job.files[0].bytes)}
        frameTitle="Create PDF preview"
        note="This is a short-document preview, not a full word processor. Choose Save as PDF in the print dialog."
        onReset={handleReset}
        resetLabel="Write another"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">Bold, italic, a heading, and a list. Paste is plain text.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => cmd("bold")} className="border border-black rounded-lg px-3 py-1 text-sm font-bold">Bold</button>
        <button type="button" onClick={() => cmd("italic")} className="border border-black rounded-lg px-3 py-1 text-sm italic">Italic</button>
        <button type="button" onClick={() => cmd("formatBlock", "H2")} className="border border-black rounded-lg px-3 py-1 text-sm">Heading</button>
        <button type="button" onClick={() => cmd("insertUnorderedList")} className="border border-black rounded-lg px-3 py-1 text-sm">List</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Document"
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
        }}
        className="min-h-40 border-2 border-black rounded-xl p-3 text-sm bg-white focus:outline-none"
      />
      {empty && <p role="alert" className="text-sm text-red-600">{empty}</p>}
      <button onClick={create} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
        Create PDF
      </button>
    </div>
  );
}
