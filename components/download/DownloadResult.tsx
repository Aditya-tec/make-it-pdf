"use client";
import { formatBytes } from "@/lib/pdf/load";
import PrivacyBadge from "@/components/PrivacyBadge";

interface FileResult {
  name: string;
  bytes: Uint8Array;
}

interface Props {
  files: FileResult[];
  onReset: () => void;
}

export default function DownloadResult({ files, onReset }: Props) {
  const download = (f: FileResult) => {
    const blob = new Blob([f.bytes.buffer as ArrayBuffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <PrivacyBadge />

      <div className="w-full max-w-md flex flex-col gap-3">
        {files.map((f, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700"
          >
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{f.name}</p>
              <p className="text-xs text-slate-500">{formatBytes(f.bytes.byteLength)}</p>
            </div>
            <button
              onClick={() => download(f)}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
      >
        Process another file
      </button>
    </div>
  );
}
