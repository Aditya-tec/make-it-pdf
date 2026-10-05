"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import HtmlPrintPreview from "@/components/HtmlPrintPreview";

export default function TextToPdfTool() {
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
        frameTitle="Text to PDF preview"
        note="Line breaks and spacing are preserved exactly as in the original file."
        onReset={handleReset}
        resetLabel="Convert another file"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="text-to-pdf" accept=".txt" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="text-to-pdf" accept=".txt" onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool: "text-to-pdf", files: [await file.arrayBuffer()], options: {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Convert to PDF
          </button>
        </>
      )}
    </div>
  );
}
