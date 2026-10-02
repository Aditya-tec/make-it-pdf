"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";

const LEVELS = [
  { id: "light", label: "Light", hint: "Small reduction, best quality" },
  { id: "medium", label: "Medium", hint: "Good balance (recommended)" },
  { id: "heavy", label: "Heavy", hint: "Maximum reduction, lower quality" },
];

export default function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState("medium");
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  const handleCompress = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    run({ tool: "compress-pdf", files: [buf], options: { level } });
  };

  const handleReset = () => { reset(); setFile(null); };

  if (!supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (job.status === "done") {
    const original = file?.size ?? 0;
    const compressed = job.files[0]?.bytes.byteLength ?? 0;
    const saving = original > 0 ? Math.round((1 - compressed / original) * 100) : 0;
    return (
      <div>
        <div className="mb-4 bg-slate-50 dark:bg-slate-700 rounded-xl p-4 flex gap-6 text-sm text-center">
          <div className="flex-1">
            <p className="text-slate-400 text-xs mb-1">Before</p>
            <p className="font-semibold">{formatBytes(original)}</p>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-xs mb-1">After</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBytes(compressed)}</p>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-xs mb-1">Saved</p>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              {saving > 0 ? `-${saving}%` : "~0%"}
            </p>
          </div>
        </div>
        <DownloadResult files={job.files} onReset={handleReset} />
      </div>
    );
  }

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

          <div>
            <p className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">
              Compression level:
            </p>
            <div className="flex gap-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className={`flex-1 text-left border rounded-xl p-3 transition-colors ${
                    level === l.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                  }`}
                >
                  <p className="font-medium text-sm">{l.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{l.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompress}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Compress PDF
          </button>
        </>
      )}
    </div>
  );
}
