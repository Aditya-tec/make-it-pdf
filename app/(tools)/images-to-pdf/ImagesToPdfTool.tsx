"use client";
import { useState, useCallback } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function ImagesToPdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState("fit");
  const { job, run, reset } = useWorker();

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
  }, []);

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const handleConvert = async () => {
    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    run({ tool: "images-to-pdf", files: buffers, options: { pageSize } });
  };

  const handleReset = () => { reset(); setFiles([]); };

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
      <UploadZone accept=".jpg,.jpeg,.png,.webp,.gif" multiple onFiles={addFiles} />

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Images (drag to reorder):
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
              <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                className="text-slate-400 hover:text-red-500">✕</button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">
              Page size:
            </label>
            <div className="flex gap-3">
              {[
                { id: "fit", label: "Fit to image" },
                { id: "a4", label: "A4" },
                { id: "letter", label: "Letter" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setPageSize(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    pageSize === s.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-slate-300 text-slate-600 hover:border-indigo-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleConvert}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Create PDF from {files.length} image{files.length > 1 ? "s" : ""}
          </button>
        </>
      )}
    </div>
  );
}
