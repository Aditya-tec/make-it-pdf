"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";

export default function HeadersFootersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [includePage, setIncludePage] = useState(true);
  const [includeDate, setIncludeDate] = useState(false);
  const { job, run, reset } = useWorker();

  const go = async () => {
    if (!file) return;
    if (!header && !footer && !includePage && !includeDate) {
      return;
    }
    run({
      tool: "headers-footers",
      files: [await file.arrayBuffer()],
      options: { header, footer, includePage, includeDate },
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
          <p className="text-sm">Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})</p>
          <label className="text-sm max-w-lg">Header text
            <input value={header} onChange={(e) => setHeader(e.target.value)} maxLength={120}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
          </label>
          <label className="text-sm max-w-lg">Footer text
            <input value={footer} onChange={(e) => setFooter(e.target.value)} maxLength={120}
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includePage} onChange={(e) => setIncludePage(e.target.checked)} />
            Include page numbers in footer
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeDate} onChange={(e) => setIncludeDate(e.target.checked)} />
            Include today&apos;s date in header
          </label>
          <button onClick={go} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Apply headers &amp; footers
          </button>
        </>
      )}
    </div>
  );
}
