"use client";
import { useRef, useState, useCallback } from "react";

import { checkFile } from "@/lib/pdf/validate";
import { getToolLimits, mbLabel } from "@/lib/pdf/toolLimits";

interface Props {
  tool: string; // slug → looks up size caps in toolLimits.ts
  accept: string; // e.g. ".pdf" or ".jpg,.png,.webp"
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}

export default function UploadZone({ tool, accept, multiple = false, onFiles, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { maxFileBytes, maxTotalBytes } = getToolLimits(tool);

  const handleFiles = useCallback(
    async (raw: FileList | null) => {
      if (!raw || raw.length === 0) return;
      const files = Array.from(raw);
      let totalSize = 0;
      const ext = accept.split(",").map((e) => e.trim().toLowerCase());
      for (const f of files) {
        const fileExt = "." + f.name.split(".").pop()?.toLowerCase();
        if (!ext.includes(fileExt)) {
          setError(`"${f.name}" is not an accepted file type (${accept}).`);
          return;
        }
        const problem = await checkFile(f, maxFileBytes);
        if (problem) {
          setError(problem);
          return;
        }
        totalSize += f.size;
      }
      if (totalSize > maxTotalBytes) {
        setError(`Total file size exceeds ${mbLabel(maxTotalBytes)} MB. Try fewer or smaller files.`);
        return;
      }
      setError(null);
      onFiles(files);
    },
    [accept, onFiles, maxFileBytes, maxTotalBytes]
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
        className={`border-2 border-dashed border-black rounded-xl p-5 sm:p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors min-h-[140px]
          ${dragOver ? "bg-volt border-solid" : "bg-white hover:border-solid"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        <span className="w-12 h-12 bg-volt border-2 border-black rounded-lg flex items-center justify-center" aria-hidden>
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeWidth={3} d="M12 19V5m-6 6l6-6 6 6" />
          </svg>
        </span>
        <p className="label-mono text-sm text-black text-center">
          Drop {multiple ? "files" : "a file"} here, or{" "}
          <span className="underline decoration-2 underline-offset-4">click to browse</span>
        </p>
        <p className="text-xs text-slate-600 text-center">
          Accepts: {accept} · Max {mbLabel(maxFileBytes)} MB per file · Or paste from clipboard
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); }}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
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
