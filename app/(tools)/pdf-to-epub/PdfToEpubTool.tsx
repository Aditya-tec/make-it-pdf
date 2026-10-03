"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function PdfToEpubTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();
  const handleReset = () => { reset(); setFile(null); };
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{job.message}</p>
      {/scanned|OCR/i.test(job.message) && (
        <a href="/ocr-pdf/" className="text-sm text-indigo-600 underline">Open OCR PDF tool</a>
      )}
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">
        Text only. Images and the original layout are not copied. A scanned PDF has nothing to wrap — run OCR first.
      </p>
      {!file ? (
        <UploadZone tool="pdf-to-epub" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="pdf-to-epub" accept=".pdf" onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool: "pdf-to-epub", files: [await file.arrayBuffer()], options: {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Convert to EPUB
          </button>
        </>
      )}
    </div>
  );
}
