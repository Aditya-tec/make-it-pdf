"use client";
import { useState, useCallback } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const { job, run, reset } = useWorker();

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
  }, []);

  const moveFile = useCallback((from: number, to: number) => {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleMerge = async () => {
    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    run({ tool: "merge-pdf", files: buffers, options: {} });
  };

  const handleReset = () => { reset(); setFiles([]); };

  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400 font-medium">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  return (
    <div className="flex flex-col gap-5">
      <UploadZone accept=".pdf" multiple onFiles={addFiles} label="Drop PDF files here" />

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Files to merge (drag to reorder):
          </p>
          {files.map((f, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("idx", String(i))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const from = Number(e.dataTransfer.getData("idx"));
                if (from !== i) moveFile(from, i);
              }}
              className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600 cursor-grab"
            >
              <span className="text-slate-400 select-none">⠿</span>
              <span className="flex-1 text-sm truncate">{f.name}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => removeFile(i)}
                aria-label={`Remove ${f.name}`}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length >= 2 && (
        <button
          onClick={handleMerge}
          className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Merge {files.length} PDFs
        </button>
      )}

      {files.length === 1 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">Add at least one more PDF to merge.</p>
      )}
    </div>
  );
}
