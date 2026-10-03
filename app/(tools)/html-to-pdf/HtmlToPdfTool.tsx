"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import HtmlPrintPreview from "@/components/HtmlPrintPreview";

export default function HtmlToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState("");
  const { job, run, reset } = useWorker();
  const handleReset = () => { reset(); setFile(null); setHtml(""); };

  const convert = async () => {
    const buf = file ? await file.arrayBuffer() : new TextEncoder().encode(html).buffer;
    run({ tool: "html-to-pdf", files: [buf], options: {} });
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
        frameTitle="HTML to PDF preview"
        note="Scripts, event handlers, and remote images are removed before this preview is shown."
        onReset={handleReset}
        resetLabel="Start over"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium text-slate-700" htmlFor="html-source">HTML source</label>
      <textarea
        id="html-source"
        aria-label="HTML"
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        rows={8}
        placeholder="<h1>Hello</h1><p>Write HTML here.</p>"
        disabled={!!file}
        className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono bg-white"
      />
      <p className="text-xs text-slate-500">Or upload an .html file. The file is used instead of the box.</p>
      {!file ? (
        <UploadZone tool="html-to-pdf" accept=".html,.htm" onFiles={(f) => setFile(f[0])} label="Upload an HTML file" />
      ) : (
        <SelectedFile file={file} tool="html-to-pdf" accept=".html,.htm" onClear={() => setFile(null)} onReplace={setFile} />
      )}
      <button
        onClick={convert}
        disabled={!file && !html.trim()}
        className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl"
      >
        Convert to PDF
      </button>
    </div>
  );
}
