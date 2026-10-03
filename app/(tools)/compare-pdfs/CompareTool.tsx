"use client";
import { useMemo, useState } from "react";
import { unzipSync } from "fflate";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";

export default function CompareTool() {
  const [a, setA] = useState<File | null>(null);
  const [b, setB] = useState<File | null>(null);
  const [highlight, setHighlight] = useState(false);
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  const pages = useMemo(() => {
    if (job.status !== "done") return [];
    const map = unzipSync(job.files[0].bytes);
    const nums = [...new Set(Object.keys(map).map((k) => k.slice(0, 4)))].sort();
    const url = (bytes: Uint8Array) => {
      let s = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return `data:image/png;base64,${btoa(s)}`;
    };
    return nums.map((n) => ({ left: url(map[`${n}-a.png`]), right: url(map[`${n}-b.png`]) }));
  }, [job]);

  const handleReset = () => { reset(); setA(null); setB(null); };

  if (!supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "done") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          {highlight
            ? "Pixels that differ are red on the right. This is a visual diff, not an AI summary."
            : "Pages scroll together. This is a visual comparison, not an AI review."}
        </p>
        <div className="max-h-[32rem] overflow-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
          {pages.map((p, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-2">
              <img src={p.left} alt={`File A page ${i + 1}`} className="w-full bg-white border border-slate-200" />
              <img src={p.right} alt={`File B page ${i + 1}`} className="w-full bg-white border border-slate-200" />
            </div>
          ))}
        </div>
        <DownloadResult files={job.files} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500">Up to 100 pages. Visual diff only — nothing here reads the document with a model.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">First PDF</p>
          {!a ? <UploadZone tool="compare-pdfs" accept=".pdf" onFiles={(f) => setA(f[0])} label="Upload the first PDF" /> : (
            <SelectedFile file={a} tool="compare-pdfs" accept=".pdf" onClear={() => setA(null)} onReplace={setA} />
          )}
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Second PDF</p>
          {!b ? <UploadZone tool="compare-pdfs" accept=".pdf" onFiles={(f) => setB(f[0])} label="Upload the second PDF" /> : (
            <SelectedFile file={b} tool="compare-pdfs" accept=".pdf" onClear={() => setB(null)} onReplace={setB} />
          )}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={highlight} onChange={(e) => setHighlight(e.target.checked)} />
        Highlight pixels that differ
      </label>
      {a && b && (
        <button
          onClick={async () => run({
            tool: "compare-pdfs",
            files: [await a.arrayBuffer(), await b.arrayBuffer()],
            options: { highlight },
          })}
          className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
        >
          Compare PDFs
        </button>
      )}
    </div>
  );
}
