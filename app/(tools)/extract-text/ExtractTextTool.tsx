"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import PrivacyBadge from "@/components/PrivacyBadge";

export default function ExtractTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const { job, run, reset } = useWorker();

  const handleExtract = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    run({ tool: "extract-text", files: [buf], options: {} });
  };

  const handleReset = () => { reset(); setFile(null); setCopied(false); };

  const downloadTxt = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes.buffer as ArrayBuffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (job.status === "done") {
    const f = job.files[0];
    const text = new TextDecoder().decode(f.bytes);
    return (
      <div className="flex flex-col gap-4">
        <PrivacyBadge />
        <p className="text-sm text-slate-500">{formatBytes(f.bytes.byteLength)} extracted</p>
        <textarea
          readOnly
          value={text}
          rows={12}
          className="w-full border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm bg-slate-50 dark:bg-slate-800 resize-y font-mono"
          aria-label="Extracted text"
        />
        <div className="flex gap-3">
          <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:border-indigo-400 transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy to clipboard"}
          </button>
          <button
            onClick={() => downloadTxt(f.bytes, f.name)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Download .txt
          </button>
          <button onClick={handleReset} className="text-sm underline text-slate-500 self-center ml-auto">
            Extract another file
          </button>
        </div>
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
          <button
            onClick={handleExtract}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Extract Text
          </button>
        </>
      )}
    </div>
  );
}
