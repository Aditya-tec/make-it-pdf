"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function FlattenTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();

  const go = async () => {
    if (!file) return;
    run({ tool: "flatten-pdf", files: [await file.arrayBuffer()], options: {} });
  };
  const handleReset = () => { reset(); setFile(null); };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="flatten-pdf" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>

          <SelectedFile
            file={file}
            tool="flatten-pdf"
            accept=".pdf"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
          <p className="text-xs text-slate-500">Form field values are baked into the page, then fields become non-editable.</p>
          <button onClick={go} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Flatten PDF
          </button>
        </>
      )}
    </div>
  );
}
