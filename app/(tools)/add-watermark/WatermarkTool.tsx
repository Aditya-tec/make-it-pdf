"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";

export default function WatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(30);
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const { job, run, reset } = useWorker();

  const handleApply = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    run({
      tool: "add-watermark",
      files: [buf],
      options: { text, opacity: opacity / 100, rotation, fontSize },
    });
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Watermark text</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm w-full bg-white dark:bg-slate-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Font size: {fontSize}pt</label>
              <input type="range" min={12} max={120} value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Opacity: {opacity}%</label>
              <input type="range" min={5} max={100} value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rotation: {rotation}°</label>
              <input type="range" min={0} max={360} value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* Preview text sample */}
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 overflow-hidden relative h-20 flex items-center justify-center border border-slate-200 dark:border-slate-600">
            <span
              className="font-bold text-slate-400 select-none pointer-events-none"
              style={{
                fontSize: `${Math.min(fontSize, 36)}px`,
                opacity: opacity / 100,
                transform: `rotate(${rotation}deg)`,
                display: "inline-block",
              }}
            >
              {text || "Watermark"}
            </span>
          </div>

          <button
            onClick={handleApply}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Apply Watermark
          </button>
        </>
      )}
    </div>
  );
}
