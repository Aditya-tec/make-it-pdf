"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import HtmlPrintPreview from "@/components/HtmlPrintPreview";

export default function MarkdownToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();
  const handleReset = () => { reset(); setFile(null); };

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
        frameTitle="Markdown to PDF preview"
        note="Code blocks and tables wrap to the page width. This is a print preview, not a pixel match of a desktop Markdown app."
        onReset={handleReset}
        resetLabel="Convert another file"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="markdown-to-pdf" accept=".md" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="markdown-to-pdf" accept=".md" onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool: "markdown-to-pdf", files: [await file.arrayBuffer()], options: {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Convert to PDF
          </button>
        </>
      )}
    </div>
  );
}
