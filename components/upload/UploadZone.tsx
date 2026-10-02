"use client";
import { useRef, useState, useCallback } from "react";

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

interface Props {
  accept: string; // e.g. ".pdf" or ".jpg,.png,.webp"
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}

export default function UploadZone({ accept, multiple = false, onFiles, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    (raw: FileList | null) => {
      if (!raw || raw.length === 0) return;
      const files = Array.from(raw);
      let totalSize = 0;
      const valid: File[] = [];
      const ext = accept.split(",").map((e) => e.trim().toLowerCase());
      for (const f of files) {
        const fileExt = "." + f.name.split(".").pop()?.toLowerCase();
        if (!ext.some((e) => e === fileExt || e === "*")) {
          setError(`"${f.name}" is not an accepted file type (${accept}).`);
          return;
        }
        totalSize += f.size;
        if (totalSize > MAX_BYTES) {
          setError("Total file size exceeds 200 MB. Try fewer or smaller files.");
          return;
        }
        valid.push(f);
      }
      setError(null);
      onFiles(valid);
    },
    [accept, onFiles]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (e.clipboardData.files.length > 0) {
        handleFiles(e.clipboardData.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label={label || "Upload files"}
        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors
          ${dragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
            : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800"
          }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-slate-600 dark:text-slate-300 font-medium text-center">
          Drop {multiple ? "files" : "a file"} here, or{" "}
          <span className="text-indigo-600 dark:text-indigo-400">click to browse</span>
        </p>
        <p className="text-xs text-slate-400">
          Accepts: {accept} · Max 200 MB · Or paste from clipboard
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        aria-hidden="true"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
