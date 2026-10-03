"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import HtmlPrintPreview from "@/components/HtmlPrintPreview";

export default function WordToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();

  const handleConvert = async () => {
    if (!file) return;
    run({ tool: "word-to-pdf", files: [await file.arrayBuffer()], options: {} });
  };

  const handleReset = () => { reset(); setFile(null); };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  if (job.status === "done") {
    return (
      <HtmlPrintPreview
        html={new TextDecoder().decode(job.files[0].bytes)}
        frameTitle="Word to PDF preview"
        note="Formatting fidelity is good but may differ from Microsoft Word for complex layouts."
        onReset={handleReset}
        resetLabel="Convert another file"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="word-to-pdf" accept=".docx" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile
            file={file}
            tool="word-to-pdf"
            accept=".docx"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
          <button
            onClick={handleConvert}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Convert to PDF
          </button>
        </>
      )}
    </div>
  );
}
