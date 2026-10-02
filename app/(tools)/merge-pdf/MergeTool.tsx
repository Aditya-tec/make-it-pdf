"use client";
import { useState, useCallback, useRef } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { checkFile } from "@/lib/pdf/validate";
import { getToolLimits } from "@/lib/pdf/toolLimits";

export default function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const { job, run, reset } = useWorker();
  const replaceIdx = useRef<number | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const { maxFileBytes } = getToolLimits("merge-pdf");

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

  const openReplace = (idx: number) => {
    replaceIdx.current = idx;
    replaceInput.current?.click();
  };

  const onReplacePick = async (list: FileList | null) => {
    const idx = replaceIdx.current;
    replaceIdx.current = null;
    if (idx == null || !list?.[0]) return;
    const problem = await checkFile(list[0], maxFileBytes);
    if (problem) return;
    setFiles((prev) => prev.map((f, i) => (i === idx ? list[0] : f)));
  };

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
      <UploadZone tool="merge-pdf" accept=".pdf" multiple onFiles={addFiles} label="Drop PDF files here" />
      <input
        ref={replaceInput}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => { onReplacePick(e.target.files); e.target.value = ""; }}
      />

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
              className="flex items-center gap-3 bg-slate-50 border-2 border-black rounded-xl px-3 py-2 cursor-grab"
            >
              <span className="text-slate-400 select-none">⠿</span>
              <span className="flex-1 text-sm truncate">{f.name}</span>
              <span className="text-xs text-slate-400 shrink-0">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => openReplace(i)}
                className="shrink-0 label-mono text-[11px] px-2 py-1 border-2 border-black rounded-md bg-white hover:bg-volt"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={`Remove ${f.name}`}
                className="shrink-0 w-8 h-8 flex items-center justify-center text-red-600 border-2 border-red-600 rounded-md hover:bg-red-50 text-xl leading-none font-bold"
              >
                ×
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
