"use client";
import { useState } from "react";
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

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i) : "";
}

/** Strip path separators / control chars; keep a sensible extension. */
function safeName(raw: string, fallback: string) {
  const cleaned = raw.replace(/[\\/:*?"<>|\x00-\x1f]/g, "").trim() || fallback;
  const want = extOf(fallback);
  if (!want) return cleaned;
  return cleaned.toLowerCase().endsWith(want.toLowerCase()) ? cleaned : cleaned + want;
}

export default function DownloadResult({ files, onReset }: Props) {
  const [names, setNames] = useState(() => files.map((f) => f.name));

  const setName = (i: number, value: string) => {
    setNames((prev) => prev.map((n, j) => (j === i ? value : n)));
  };

  const download = (f: FileResult, i: number) => {
    const name = safeName(names[i] ?? f.name, f.name);
    const blob = new Blob([f.bytes.buffer as ArrayBuffer]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
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
            className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white px-4 py-3 border-2 border-black rounded-xl shadow-[3px_3px_0_#000]"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`out-name-${i}`}
                className="block label-mono text-[11px] text-black mb-1"
              >
                Rename file
              </label>
              <div className="relative">
                <input
                  id={`out-name-${i}`}
                  type="text"
                  value={names[i] ?? f.name}
                  onChange={(e) => setName(i, e.target.value)}
                  onBlur={() => setName(i, safeName(names[i] ?? f.name, f.name))}
                  spellCheck={false}
                  className="w-full font-medium text-sm bg-white border-2 border-black rounded-lg pl-3 pr-9 py-2 outline-none focus:ring-2 focus:ring-blue-500 selection:bg-blue-500 selection:text-white"
                />
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-hidden
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536M9 13l6.232-6.232a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-1.414a2 2 0 01.586-1.414z" />
                  </svg>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{formatBytes(f.bytes.byteLength)}</p>
            </div>
            <button
              onClick={() => download(f, i)}
              className="w-full sm:w-auto shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="label-mono text-xs text-black underline decoration-2 underline-offset-4 hover:bg-volt"
      >
        Process another file
      </button>
    </div>
  );
}
