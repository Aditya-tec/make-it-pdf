"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function ExcelToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();
  const handleReset = () => { reset(); setFile(null); };
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">
        Only the first sheet is exported. The header row is bold and cells have borders. Other Excel fonts, colors, and merged-cell spans are not copied — a merged value stays in the top-left cell. Move another sheet to the front, or save it as CSV, to convert that one instead.
      </p>
      {!file ? (
        <UploadZone tool="excel-to-pdf" accept=".xlsx,.xls" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="excel-to-pdf" accept=".xlsx,.xls" onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool: "excel-to-pdf", files: [await file.arrayBuffer()], options: {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Convert to PDF
          </button>
        </>
      )}
    </div>
  );
}
