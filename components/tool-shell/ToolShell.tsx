"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import type { WorkerRequest } from "@/lib/workers/pdf.worker";
import Link from "next/link";

interface Props {
  tool: string; // slug, e.g. "merge-pdf"
  accept: string;
  multiple?: boolean;
  uploadLabel?: string;
  // Render any extra controls between file upload and the Run button
  controls?: (files: File[], setFiles: (f: File[]) => void) => React.ReactNode;
  // Build the worker options object from current state
  buildOptions?: (files: File[]) => Record<string, unknown>;
  // For tools like word-to-pdf that return HTML and need browser print
  onHtmlResult?: (html: string) => void;
  relatedTools?: { slug: string; name: string }[];
}

export default function ToolShell({
  tool,
  accept,
  multiple = false,
  uploadLabel,
  controls,
  buildOptions,
  onHtmlResult,
  relatedTools,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const { job, run, reset } = useWorker();

  const handleRun = async () => {
    if (files.length === 0) return;
    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    const options = buildOptions ? buildOptions(files) : {};
    const req: WorkerRequest = { tool, files: buffers, options };
    run(req);
  };

  const handleResult = (resultFiles: { name: string; bytes: Uint8Array }[]) => {
    // Handle word-to-pdf HTML result specially
    if (onHtmlResult && resultFiles.length === 1 && resultFiles[0].name.endsWith(".html")) {
      const html = new TextDecoder().decode(resultFiles[0].bytes);
      onHtmlResult(html);
      return;
    }
    // normal download handled by DownloadResult
  };

  const handleReset = () => {
    reset();
    setFiles([]);
  };

  if (job.status === "done") {
    // Check if it's an HTML result for word-to-pdf
    if (
      onHtmlResult &&
      job.files.length === 1 &&
      job.files[0].name.endsWith(".html")
    ) {
      handleResult(job.files);
      // Fall through to show download result anyway in case onHtmlResult is not set
    }
    return (
      <div>
        <DownloadResult files={job.files} onReset={handleReset} />
        {relatedTools && relatedTools.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-2">Try also:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {relatedTools.map((t) => (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full px-3 py-1 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (job.status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md w-full text-center">
          <p className="text-red-600 dark:text-red-400 font-medium mb-1">Something went wrong</p>
          <p className="text-sm text-red-500 dark:text-red-300">{job.message}</p>
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-slate-500 hover:text-indigo-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {job.status === "processing" ? (
        <ProgressBar percent={job.percent} message={job.message} />
      ) : (
        <>
          {files.length === 0 || multiple ? (
            <UploadZone
              tool={tool}
              accept={accept}
              multiple={multiple}
              onFiles={(incoming) =>
                setFiles((prev) => (multiple ? [...prev, ...incoming] : incoming))
              }
              label={uploadLabel}
            />
          ) : null}

          {files.length === 1 && !multiple ? (
            <SelectedFile
              file={files[0]}
              tool={tool}
              accept={accept}
              onClear={() => setFiles([])}
              onReplace={(f) => setFiles([f])}
            />
          ) : null}

          {multiple && files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  <SelectedFile
                    file={f}
                    tool={tool}
                    accept={accept}
                    onClear={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    onReplace={(next) =>
                      setFiles((prev) => prev.map((p, j) => (j === i ? next : p)))
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {controls && files.length > 0 && controls(files, setFiles)}

          {files.length > 0 && (
            <button
              onClick={handleRun}
              className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Run
            </button>
          )}
        </>
      )}
    </div>
  );
}
