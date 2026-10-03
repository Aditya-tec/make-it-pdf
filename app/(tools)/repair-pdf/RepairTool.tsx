"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function RepairTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();
  const handleReset = () => { reset(); setFile(null); };
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "done") {
    const partial = job.files[0].name.startsWith("partially");
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-sm text-slate-700">
          {partial
            ? "Partially recovered. Damaged objects were skipped, so pages or content may be missing. This is not a full repair."
            : "Rebuilt successfully. The file parsed and was written back out with a fresh structure."}
        </p>
        <DownloadResult files={job.files} onReset={handleReset} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">
        Some damaged files can only be partly recovered, and some cannot be opened at all. The result line tells you which happened.
      </p>
      {!file ? (
        <UploadZone tool="repair-pdf" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="repair-pdf" accept=".pdf" onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool: "repair-pdf", files: [await file.arrayBuffer()], options: {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Repair PDF
          </button>
        </>
      )}
    </div>
  );
}
