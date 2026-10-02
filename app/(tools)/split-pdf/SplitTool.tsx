"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import PageGrid, { type PageItem } from "@/components/preview/PageGrid";
import { useWorker } from "@/hooks/useWorker";
import { loadPdfForPreview, renderThumbnail } from "@/lib/pdf/render";
import { friendlyError } from "@/lib/pdf/validate";
import type { PDFDocumentProxy } from "pdfjs-dist";

export default function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [ranges, setRanges] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"click" | "range">("click");
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const { job, run, reset } = useWorker();

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        const pdf = await loadPdfForPreview(await file.arrayBuffer());
        if (cancelled) return;
        pdfRef.current = pdf;
        setLoadError(null);
        setPages(
          Array.from({ length: pdf.numPages }, (_, i) => ({
            index: i,
            rotation: 0,
            selected: false,
          }))
        );
      } catch (e) {
        if (cancelled) return;
        setLoadError(friendlyError(e));
        setFile(null);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const renderPage = useCallback(async (index: number): Promise<string> => {
    if (!pdfRef.current) return "";
    return renderThumbnail(pdfRef.current, index);
  }, []);

  const toggleSelect = useCallback((pos: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === pos ? { ...p, selected: !p.selected } : p))
    );
  }, []);

  const handleSplit = async () => {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const selected = pages.filter((p) => p.selected).map((p) => p.index + 1);
    const r =
      mode === "range"
        ? ranges
        : selected.length > 0
        ? selected.join(",")
        : "";
    run({ tool: "split-pdf", files: [buf], options: { ranges: r } });
  };

  const handleReset = () => { reset(); setFile(null); setPages([]); setRanges(""); };

  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;

  if (!file) return (
    <>
      <UploadZone accept=".pdf" onFiles={(f) => setFile(f[0])} />
      {loadError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{loadError}</p>}
    </>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 items-center">
        <button
          onClick={() => setMode("click")}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            mode === "click"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-slate-300 text-slate-600 hover:border-indigo-400"
          }`}
        >
          Click pages
        </button>
        <button
          onClick={() => setMode("range")}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
            mode === "range"
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-slate-300 text-slate-600 hover:border-indigo-400"
          }`}
        >
          Page ranges
        </button>
      </div>

      {mode === "range" ? (
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
            Page ranges (e.g. 1-3, 5, 7-10)
          </label>
          <input
            type="text"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="1-3, 5, 7-10"
            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm w-full max-w-xs bg-white dark:bg-slate-700"
          />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Click pages to select for extraction:</p>
      )}

      <PageGrid
        pages={pages}
        mode="select"
        onToggleSelect={toggleSelect}
        renderPage={renderPage}
      />

      <button
        onClick={handleSplit}
        className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        {mode === "click" && pages.filter((p) => p.selected).length > 0
          ? `Extract ${pages.filter((p) => p.selected).length} pages`
          : "Split all pages"}
      </button>
    </div>
  );
}
