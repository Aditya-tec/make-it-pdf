"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function PageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("n");
  const [start, setStart] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [position, setPosition] = useState("bottom-center");
  const [fontSize, setFontSize] = useState(12);
  const { job, run, reset } = useWorker();

  const go = async () => {
    if (!file) return;
    run({
      tool: "page-numbers",
      files: [await file.arrayBuffer()],
      options: { format, start, skipFirst, position, fontSize },
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
        <UploadZone tool="page-numbers" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>

          <SelectedFile
            file={file}
            tool="page-numbers"
            accept=".pdf"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            <label className="text-sm">Format
              <select value={format} onChange={(e) => setFormat(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                <option value="n">1, 2, 3…</option>
                <option value="n/N">1/10, 2/10…</option>
                <option value="Page n">Page 1, Page 2…</option>
              </select>
            </label>
            <label className="text-sm">Start at
              <input type="number" min={1} value={start} onChange={(e) => setStart(Number(e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
            </label>
            <label className="text-sm">Position
              <select value={position} onChange={(e) => setPosition(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                <option value="bottom-center">Bottom center</option>
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-right">Bottom right</option>
                <option value="top-center">Top center</option>
              </select>
            </label>
            <label className="text-sm">Font size
              <input type="number" min={8} max={36} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} />
            Skip first page (cover)
          </label>
          <button onClick={go} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Add page numbers
          </button>
        </>
      )}
    </div>
  );
}
