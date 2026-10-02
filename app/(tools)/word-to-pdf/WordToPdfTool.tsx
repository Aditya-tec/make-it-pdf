"use client";
import { useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import { useWorker } from "@/hooks/useWorker";
import PrivacyBadge from "@/components/PrivacyBadge";

const STYLE = `<style>
  body { font-family: Georgia, serif; font-size: 12pt; margin: 2cm; line-height: 1.6; color: #000; }
  h1,h2,h3,h4 { font-family: Arial, sans-serif; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; }
  img { max-width: 100%; }
  @page { margin: 2cm; }
</style>`;

export default function WordToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { job, run, reset } = useWorker();

  // The .docx is untrusted: sanitize the generated HTML before it touches any DOM.
  const srcDoc = useMemo(() => {
    if (job.status !== "done") return "";
    const clean = DOMPurify.sanitize(new TextDecoder().decode(job.files[0].bytes));
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${STYLE}</head><body>${clean}</body></html>`;
  }, [job]);

  const handleConvert = async () => {
    if (!file) return;
    run({ tool: "word-to-pdf", files: [await file.arrayBuffer()], options: {} });
  };

  const handleReset = () => { reset(); setFile(null); };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  if (job.status === "done") {
    return (
      <div className="flex flex-col gap-4">
        <PrivacyBadge />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Your document is ready. Click <strong>Save as PDF</strong>, your browser will open the print
          dialog where you can choose &ldquo;Save as PDF&rdquo; as the destination.
        </p>
        <p className="text-xs text-slate-400">
          Note: Formatting fidelity is good but may differ from Microsoft Word for complex layouts.
        </p>
        {/* no allow-scripts: nothing inside can execute, even if sanitizing missed something */}
        <iframe
          ref={iframeRef}
          title="Word to PDF preview"
          sandbox="allow-same-origin allow-modals"
          srcDoc={srcDoc}
          className="w-full h-96 border border-slate-200 dark:border-slate-700 rounded-lg bg-white"
        />
        <div className="flex gap-3">
          <button
            onClick={() => iframeRef.current?.contentWindow?.print()}
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
        <UploadZone tool="word-to-pdf" accept=".docx" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>

          <SelectedFile
            file={file}
            tool="word-to-pdf"
            accept=".docx"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
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
