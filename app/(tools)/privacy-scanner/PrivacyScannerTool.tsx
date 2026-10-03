"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import PrivacyBadge from "@/components/PrivacyBadge";
import { useWorker } from "@/hooks/useWorker";
import type { Finding } from "@/lib/workers/engines/privacyScanner";

function parseFindings(bytes: Uint8Array): Finding[] {
  try {
    return JSON.parse(new TextDecoder().decode(bytes)).findings || [];
  } catch {
    return [];
  }
}

export default function PrivacyScannerTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();

  // Derive UI from the worker result — no effect sync.
  const done = job.status === "done" ? job : null;
  const isStripped = !!done && done.files.some((f) => f.name.endsWith(".pdf"));
  const findings =
    done && !isStripped
      ? (() => {
          const report = done.files.find((f) => f.name.endsWith(".json"));
          return report ? parseFindings(report.bytes) : null;
        })()
      : null;

  const scan = async () => {
    if (!file) return;
    run({ tool: "privacy-scanner", files: [await file.arrayBuffer()], options: { strip: false } });
  };
  const strip = async () => {
    if (!file) return;
    run({ tool: "privacy-scanner", files: [await file.arrayBuffer()], options: { strip: true } });
  };
  const handleReset = () => {
    reset();
    setFile(null);
  };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (isStripped && done) {
    const pdf = done.files.filter((f) => f.name.endsWith(".pdf"));
    const removed = done.files.find((f) => f.name === "removed-metadata.json");
    const removedList = removed ? parseFindings(removed.bytes) : [];
    return (
      <div className="flex flex-col gap-4">
        {removedList.length > 0 && (
          <div className="text-sm border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 bg-emerald-50 dark:bg-emerald-950">
            <p className="font-medium mb-2">Removed from this file:</p>
            <ul className="space-y-1 text-slate-600 dark:text-slate-300">
              {removedList.map((f, i) => (
                <li key={i}><span className="font-medium">{f.key}:</span> {f.value}</li>
              ))}
            </ul>
          </div>
        )}
        <DownloadResult files={pdf} onReset={handleReset} />
      </div>
    );
  }

  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  if (findings) {
    return (
      <div className="flex flex-col gap-4">
        <PrivacyBadge />
        <h3 className="font-semibold">Scan results</h3>
        {findings.length === 0 ? (
          <p className="text-sm text-slate-500">No document-info fields found.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {findings.map((f, i) => (
              <li key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 flex gap-3">
                <span className={`text-xs uppercase tracking-wide shrink-0 ${
                  f.risk === "high" ? "text-red-600" : f.risk === "medium" ? "text-amber-600" : "text-slate-500"
                }`}>{f.risk}</span>
                <div>
                  <p className="font-medium">{f.key}</p>
                  <p className="text-slate-500 break-all">{f.value}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">
          This scan only reads the standard document-info fields (title, author, apps, dates). It does not check XMP metadata, embedded files, or text and images inside pages, so it is not a guarantee the file is clean.
        </p>
        <div className="flex gap-3 flex-wrap">
          {findings.length > 0 && (
            <button onClick={strip} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
              Strip &amp; download clean PDF
            </button>
          )}
          <button onClick={handleReset} className="text-sm underline text-slate-500 self-center">Scan another file</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="privacy-scanner" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile
            file={file}
            tool="privacy-scanner"
            accept=".pdf"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
          <button onClick={scan} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Scan for metadata
          </button>
        </>
      )}
    </div>
  );
}
