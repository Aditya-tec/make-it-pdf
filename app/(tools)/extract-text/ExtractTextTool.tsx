"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import PrivacyBadge from "@/components/PrivacyBadge";

function safeTxtName(raw: string) {
  const cleaned = raw.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim() || "extracted.txt";
  return cleaned.toLowerCase().endsWith(".txt") ? cleaned : cleaned + ".txt";
}

export default function ExtractTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [outName, setOutName] = useState("extracted.txt");
  const { job, run, reset } = useWorker();

  const handleExtract = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    run({ tool: "extract-text", files: [buf], options: {} });
  };

  const handleReset = () => { reset(); setFile(null); setCopied(false); setOutName("extracted.txt"); };

  const downloadTxt = (bytes: Uint8Array) => {
    const blob = new Blob([bytes.buffer as ArrayBuffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeTxtName(outName);
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
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="sr-only" htmlFor="extract-out-name">Filename</label>
          <input
            id="extract-out-name"
            type="text"
            value={outName}
            onChange={(e) => setOutName(e.target.value)}
            onBlur={() => setOutName(safeTxtName(outName))}
            spellCheck={false}
            className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700"
          />
          <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:border-indigo-400 transition-colors"
          >
            {copied ? "✓ Copied!" : "Copy to clipboard"}
          </button>
          <button
            onClick={() => downloadTxt(f.bytes)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Download .txt
          </button>
          <button onClick={handleReset} className="text-sm underline text-slate-500 self-center">
            Extract another file
          </button>
        </div>
      </div>
    );
  }

  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400 text-center max-w-md">{job.message}</p>
      {/scanned|OCR/i.test(job.message) && (
        <a href="/ocr-pdf/" className="text-sm text-indigo-600 dark:text-indigo-400 underline">
          Open OCR PDF tool
        </a>
      )}
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="extract-text" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>

          <SelectedFile
            file={file}
            tool="extract-text"
            accept=".pdf"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
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
