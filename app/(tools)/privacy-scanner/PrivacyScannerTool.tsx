"use client";
import { useEffect, useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import PrivacyBadge from "@/components/PrivacyBadge";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import type { Finding } from "@/lib/workers/engines/privacyScanner";

export default function PrivacyScannerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [phase, setPhase] = useState<"idle" | "scanned" | "stripped">("idle");
  const { job, run, reset } = useWorker();

  useEffect(() => {
    if (job.status !== "done") return;
    if (job.files.some((f) => f.name.endsWith(".pdf"))) {
      setPhase("stripped");
      return;
    }
    const report = job.files.find((f) => f.name.endsWith(".json"));
    if (report) {
      try {
        setFindings(JSON.parse(new TextDecoder().decode(report.bytes)).findings || []);
      } catch {
        setFindings([]);
      }
      setPhase("scanned");
    }
  }, [job]);

  const scan = async () => {
    if (!file) return;
    setFindings(null);
    setPhase("idle");
    run({ tool: "privacy-scanner", files: [await file.arrayBuffer()], options: { strip: false } });
  };
  const strip = async () => {
    if (!file) return;
    run({ tool: "privacy-scanner", files: [await file.arrayBuffer()], options: { strip: true } });
  };
  const handleReset = () => {
    reset();
    setFile(null);
    setFindings(null);
    setPhase("idle");
  };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (phase === "stripped" && job.status === "done") {
    const pdf = job.files.filter((f) => f.name.endsWith(".pdf"));
    const removed = job.files.find((f) => f.name === "removed-metadata.json");
    let removedList: Finding[] = [];
    if (removed) {
      try {
        removedList = JSON.parse(new TextDecoder().decode(removed.bytes)).findings || [];
      } catch { /* */ }
    }
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

  if (phase === "scanned" && findings) {
    return (
      <div className="flex flex-col gap-4">
        <PrivacyBadge />
        <h3 className="font-semibold">Scan results</h3>
        {findings.length === 0 ? (
          <p className="text-sm text-slate-500">No metadata fields found. Your PDF looks clean.</p>
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
        <UploadZone accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <p className="text-sm">Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})</p>
          <button onClick={scan} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Scan for metadata
          </button>
        </>
      )}
    </div>
  );
}
