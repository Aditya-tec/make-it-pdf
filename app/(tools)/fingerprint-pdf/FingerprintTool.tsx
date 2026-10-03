"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

function makeId() {
  const b = crypto.getRandomValues(new Uint8Array(4));
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `FP-${hex}-${Date.now().toString(36).toUpperCase()}`;
}

export default function FingerprintTool() {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [id, setId] = useState("");
  const { job, run, reset } = useWorker();
  const handleReset = () => { reset(); setFile(null); setId(""); };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "done") {
    return (
      <div className="flex flex-col gap-4">
        <div className="border-2 border-black rounded-xl p-3 bg-white" role="status">
          <p className="text-xs text-slate-600">Fingerprint ID — write this down next to the recipient. It is not saved anywhere.</p>
          <p className="font-mono text-lg break-all" data-testid="fingerprint-id">{id}{label.trim() ? ` · ${label.trim()}` : ""}</p>
        </div>
        <DownloadResult files={job.files} onReset={handleReset} />
      </div>
    );
  }

  const start = async () => {
    if (!file) return;
    const next = makeId();
    setId(next);
    run({ tool: "fingerprint-pdf", files: [await file.arrayBuffer()], options: { id: next, label } });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">
        A <strong>deterrent, not forensic tracking</strong>: the ID is stored in the file&apos;s metadata and as near-invisible text on every page.
        Re-printing to a new PDF, flattening, screenshots, or stripping metadata can remove it. Run one copy per recipient.
      </p>
      {!file ? (
        <UploadZone tool="fingerprint-pdf" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="fingerprint-pdf" accept=".pdf" onClear={() => setFile(null)} onReplace={setFile} />
          <label className="text-sm font-medium text-slate-700">
            Recipient (optional, Latin characters)
            <input
              value={label}
              maxLength={60}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              placeholder="e.g. Acme legal team"
            />
          </label>
          <button onClick={start} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Add fingerprint
          </button>
        </>
      )}
    </div>
  );
}
