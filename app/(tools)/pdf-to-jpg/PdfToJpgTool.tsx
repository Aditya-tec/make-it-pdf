"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";

export default function PdfToJpgTool() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [format, setFormat] = useState("jpeg");
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  const handleConvert = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    run({ tool: "pdf-to-jpg", files: [buf], options: { dpi, format } });
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
        <UploadZone tool="pdf-to-jpg" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>

          <SelectedFile
            file={file}
            tool="pdf-to-jpg"
            accept=".pdf"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />

          <div className="flex gap-6 flex-wrap">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
                Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700"
              >
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-600 dark:text-slate-300">
                DPI: {dpi}
              </label>
              <input
                type="range"
                min={72}
                max={300}
                step={1}
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                className="w-40"
              />
              <div className="flex justify-between text-xs text-slate-400 w-40">
                <span>72</span><span>150</span><span>300</span>
              </div>
            </div>
          </div>

          {dpi > 200 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              High DPI produces large files and may be slow on mobile devices.
            </p>
          )}

          <button
            onClick={handleConvert}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Convert to {format === "jpeg" ? "JPG" : "PNG"}
          </button>
        </>
      )}
    </div>
  );
}
