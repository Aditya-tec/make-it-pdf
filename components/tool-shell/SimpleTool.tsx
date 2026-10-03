"use client";
import { useState, type ReactNode } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import HtmlPrintPreview from "@/components/HtmlPrintPreview";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";
import { useWorker } from "@/hooks/useWorker";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";

interface Props {
  tool: string;
  accept: string;
  button: string;
  intro: ReactNode;
  options?: Record<string, unknown>;
  /** Engine returns an HTML fragment that is sanitized and printed (Word-to-PDF style). */
  print?: { frameTitle: string; note: string; extraCss?: string };
  /** Tool draws pages on a canvas, so it needs OffscreenCanvas. */
  needsCanvas?: boolean;
  /** Shown above the download (e.g. a preview). */
  renderDone?: (files: { name: string; bytes: Uint8Array }[]) => ReactNode;
}

export default function SimpleTool({ tool, accept, button, intro, options, print, needsCanvas, renderDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);
  const handleReset = () => { reset(); setFile(null); };

  if (needsCanvas && !supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{job.message}</p>
      {/scanned|OCR/i.test(job.message) && <a href="/ocr-pdf/" className="text-sm text-indigo-600 underline">Open OCR PDF tool</a>}
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "done") {
    if (print) {
      return (
        <HtmlPrintPreview
          html={new TextDecoder().decode(job.files[0].bytes)}
          frameTitle={print.frameTitle}
          note={print.note}
          extraCss={print.extraCss}
          onReset={handleReset}
          resetLabel="Convert another file"
        />
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {job.warning && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm p-3">{job.warning}</p>}
        {renderDone?.(job.files)}
        <DownloadResult files={job.files} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-xs text-slate-500">{intro}</div>
      {!file ? (
        <UploadZone tool={tool} accept={accept} onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool={tool} accept={accept} onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool, files: [await file.arrayBuffer()], options: options ?? {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            {button}
          </button>
        </>
      )}
    </div>
  );
}
