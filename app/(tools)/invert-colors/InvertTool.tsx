"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";

export default function InvertTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"invert" | "grayscale" | "sepia">("invert");
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  const go = async () => {
    if (!file) return;
    run({ tool: "invert-colors", files: [await file.arrayBuffer()], options: { mode } });
  };
  const handleReset = () => { reset(); setFile(null); };

  if (!supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
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
        <UploadZone accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <p className="text-sm">Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})</p>
          <div className="flex gap-2 flex-wrap">
            {([
              ["invert", "Invert (dark mode)"],
              ["grayscale", "Grayscale"],
              ["sepia", "Sepia"],
            ] as const).map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)}
                className={`px-4 py-2 rounded-lg text-sm border ${mode === id ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300 max-w-md">
            Pages are re-rendered as images so colours can change. Text will no longer be selectable in the output.
          </p>
          <button onClick={go} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Convert
          </button>
        </>
      )}
    </div>
  );
}
