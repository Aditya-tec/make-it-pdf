"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";

const ANGLES = [90, 180, 270] as const;

export default function RotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<number>(90);
  const { job, run, reset } = useWorker();

  const go = async () => {
    if (!file) return;
    run({ tool: "rotate-pdf", files: [await file.arrayBuffer()], options: { angle } });
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
        <UploadZone accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})
          </p>
          <div className="flex gap-2">
            {ANGLES.map((a) => (
              <button
                key={a}
                onClick={() => setAngle(a)}
                className={`px-4 py-2 rounded-lg text-sm border ${
                  angle === a
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-300 text-slate-600 hover:border-indigo-400"
                }`}
              >
                {a}°
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">Rotation is additive — already-rotated pages keep their orientation.</p>
          <button onClick={go} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Rotate PDF
          </button>
        </>
      )}
    </div>
  );
}
