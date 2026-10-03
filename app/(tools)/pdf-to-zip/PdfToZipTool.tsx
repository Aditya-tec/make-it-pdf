"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";

export default function PdfToZipTool() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [format, setFormat] = useState("jpeg");
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  const handleReset = () => { reset(); setFile(null); };
  if (!supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="pdf-to-zip" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="pdf-to-zip" accept=".pdf" onClear={() => setFile(null)} onReplace={setFile} />
          <div className="flex gap-6 flex-wrap">
            <label className="text-sm font-medium text-slate-600">
              Format
              <select value={format} onChange={(e) => setFormat(e.target.value)} className="mt-1 block border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              DPI: {dpi}
              <input type="range" min={72} max={300} value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="mt-2 block w-40" />
            </label>
          </div>
          <button
            onClick={async () => file && run({ tool: "pdf-to-zip", files: [await file.arrayBuffer()], options: { dpi, format } })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Create ZIP
          </button>
        </>
      )}
    </div>
  );
}
