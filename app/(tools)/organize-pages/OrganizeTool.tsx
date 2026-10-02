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
import type { PageOp } from "@/lib/workers/engines/organizePages";

export default function OrganizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  // undo stack — ponytail: unlimited, limited by RAM; fine for typical docs
  const [history, setHistory] = useState<PageItem[][]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
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
        setHistory([]);
      } catch (e) {
        if (cancelled) return;
        setLoadError(friendlyError(e));
        setFile(null);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const pushHistory = useCallback((current: PageItem[]) => {
    setHistory((h) => [...h, current]);
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setPages((prev) => {
      pushHistory(prev);
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  }, [pushHistory]);

  const rotate = useCallback((pos: number) => {
    setPages((prev) => {
      pushHistory(prev);
      return prev.map((p, i) =>
        i === pos ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      );
    });
  }, [pushHistory]);

  const deletePage = useCallback((pos: number) => {
    setPages((prev) => {
      pushHistory(prev);
      return prev.filter((_, i) => i !== pos);
    });
  }, [pushHistory]);

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPages(prev);
      return h.slice(0, -1);
    });
  };

  const renderPage = useCallback(async (index: number): Promise<string> => {
    if (!pdfRef.current) return "";
    return renderThumbnail(pdfRef.current, index);
  }, []);

  const handleSave = async () => {
    if (!file || pages.length === 0) return;
    const buf = await file.arrayBuffer();
    const ops: PageOp[] = pages.map((p) => ({
      originalIndex: p.index,
      rotation: p.rotation,
    }));
    run({ tool: "organize-pages", files: [buf], options: { pages: ops } });
  };

  const handleReset = () => { reset(); setFile(null); setPages([]); setHistory([]); };

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
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-40 hover:border-indigo-400 transition-colors"
        >
          ↩ Undo
        </button>
        <p className="text-sm text-slate-500 self-center">
          {pages.length} page{pages.length !== 1 ? "s" : ""}
          {history.length > 0 && ` · ${history.length} unsaved change${history.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <PageGrid
        pages={pages}
        mode="reorder"
        onReorder={reorder}
        onRotate={rotate}
        onDelete={deletePage}
        renderPage={renderPage}
      />

      <button
        onClick={handleSave}
        disabled={pages.length === 0}
        className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Save PDF
      </button>
    </div>
  );
}
