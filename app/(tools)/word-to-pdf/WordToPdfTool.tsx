"use client";
import { useState, useRef } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import PrivacyBadge from "@/components/PrivacyBadge";

export default function WordToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlReady, setHtmlReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { job, run, reset } = useWorker();

  const handleConvert = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    run({ tool: "word-to-pdf", files: [buf], options: {} });
  };

  // When the worker returns HTML, load it into the hidden iframe
  if (job.status === "done" && !htmlReady) {
    const f = job.files[0];
    if (f && f.name.endsWith(".html")) {
      const html = new TextDecoder().decode(f.bytes);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = url;
          setHtmlReady(true);
        }
      }, 50);
    }
  }

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleReset = () => { reset(); setFile(null); setHtmlReady(false); };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  if (job.status === "done" && htmlReady) {
    return (
      <div className="flex flex-col gap-4">
        <PrivacyBadge />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your document is ready. Click <strong>Save as PDF</strong> — your browser will open the print
          dialog where you can choose &ldquo;Save as PDF&rdquo; as the destination.
        </p>
        <p className="text-xs text-slate-400">
          Note: Formatting fidelity is good but may differ from Microsoft Word for complex layouts.
        </p>
        {/* Hidden iframe for printing */}
        <iframe
          ref={iframeRef}
          title="Word to PDF preview"
          className="w-full h-96 border border-slate-200 dark:border-slate-700 rounded-lg bg-white"
        />
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Save as PDF (Print)
          </button>
          <button onClick={handleReset} className="text-sm underline text-slate-500 self-center">
            Convert another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone accept=".docx" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})
          </p>
          <button
            onClick={handleConvert}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Convert to PDF
          </button>
        </>
      )}
    </div>
  );
}
