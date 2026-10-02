"use client";
import { useRef, useState } from "react";
import { formatBytes } from "@/lib/pdf/load";
import { checkFile } from "@/lib/pdf/validate";
import { getToolLimits } from "@/lib/pdf/toolLimits";

interface Props {
  file: File;
  tool: string;
  accept?: string;
  onClear: () => void;
  onReplace: (file: File) => void;
}

/** Compact selected-file row: name, replace, red × to remove. */
export default function SelectedFile({
  file,
  tool,
  accept = ".pdf",
  onClear,
  onReplace,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { maxFileBytes } = getToolLimits(tool);

  const pick = async (list: FileList | null) => {
    if (!list?.[0]) return;
    const next = list[0];
    const problem = await checkFile(next, maxFileBytes);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onReplace(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border-2 border-black rounded-xl px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-black">{file.name}</p>
          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 label-mono text-[11px] min-h-10 px-2.5 py-1.5 border-2 border-black rounded-md bg-white hover:bg-volt transition-colors"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove ${file.name}`}
          className="shrink-0 w-10 h-10 flex items-center justify-center text-red-600 border-2 border-red-600 rounded-md hover:bg-red-50 text-xl leading-none font-bold"
        >
          ×
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
