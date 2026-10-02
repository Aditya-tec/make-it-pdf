"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import { loadPdfForPreview, renderThumbnail } from "@/lib/pdf/render";
import { friendlyError } from "@/lib/pdf/validate";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { RedactRect } from "@/lib/workers/engines/redactPdf";

export default function RedactTool() {
  const [file, setFile] = useState<File | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [thumb, setThumb] = useState<string>("");
  const [rectsByPage, setRectsByPage] = useState<Record<number, RedactRect[]>>({});
  const drag = useRef<{ x0: number; y0: number } | null>(null);
  const [draft, setDraft] = useState<RedactRect | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        const pdf = await loadPdfForPreview(await file.arrayBuffer());
        if (cancelled) return;
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
        setPageIndex(0);
        setLoadError(null);
        setThumb(await renderThumbnail(pdf, 0, 480));
      } catch (e) {
        if (!cancelled) { setLoadError(friendlyError(e)); setFile(null); }
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  useEffect(() => {
    if (!pdfRef.current) return;
    let cancelled = false;
    renderThumbnail(pdfRef.current, pageIndex, 480).then((u) => {
      if (!cancelled) setThumb(u);
    });
    return () => { cancelled = true; };
  }, [pageIndex]);

  const rel = useCallback((e: React.PointerEvent) => {
    const el = imgRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    const p = rel(e);
    drag.current = { x0: p.x, y0: p.y };
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = rel(e);
    const x = Math.min(drag.current.x0, p.x);
    const y = Math.min(drag.current.y0, p.y);
    setDraft({ x, y, w: Math.abs(p.x - drag.current.x0), h: Math.abs(p.y - drag.current.y0) });
  };
  const onUp = () => {
    if (draft && draft.w > 0.01 && draft.h > 0.01) {
      setRectsByPage((prev) => ({
        ...prev,
        [pageIndex]: [...(prev[pageIndex] || []), draft],
      }));
    }
    drag.current = null;
    setDraft(null);
  };

  const go = async () => {
    if (!file) return;
    const pages = Object.entries(rectsByPage).map(([k, rects]) => ({
      pageIndex: Number(k),
      rects,
    }));
    run({ tool: "redact-pdf", files: [await file.arrayBuffer()], options: { pages } });
  };
  const handleReset = () => {
    reset(); setFile(null); setRectsByPage({}); setThumb(""); setPageCount(0);
  };

  if (!supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  if (!file) return (
    <>
      <UploadZone accept=".pdf" onFiles={(f) => setFile(f[0])} />
      {loadError && <p role="alert" className="mt-2 text-sm text-red-600">{loadError}</p>}
    </>
  );

  const rects = rectsByPage[pageIndex] || [];
  const totalBoxes = Object.values(rectsByPage).reduce((n, r) => n + r.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})</p>
      <p className="text-xs text-slate-500">Drag on the page to draw black boxes. Redacted pages become images so text under a box cannot be recovered.</p>
      <div className="flex items-center gap-3 text-sm">
        <button disabled={pageIndex <= 0} onClick={() => setPageIndex((i) => i - 1)}
          className="px-3 py-1 border rounded-lg disabled:opacity-40">Prev</button>
        <span>Page {pageIndex + 1} / {pageCount}</span>
        <button disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex((i) => i + 1)}
          className="px-3 py-1 border rounded-lg disabled:opacity-40">Next</button>
        <button onClick={() => setRectsByPage((p) => ({ ...p, [pageIndex]: [] }))}
          className="ml-auto text-xs underline text-slate-500">Clear page boxes</button>
      </div>
      <div className="relative inline-block max-w-full border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden touch-none">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={imgRef} src={thumb} alt="" className="max-w-full block select-none"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} draggable={false} />
        ) : (
          <div className="w-64 h-80 animate-pulse bg-slate-200 dark:bg-slate-700" />
        )}
        {[...rects, ...(draft ? [draft] : [])].map((r, i) => (
          <div key={i} className="absolute bg-black/90 pointer-events-none"
            style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }} />
        ))}
      </div>
      <button disabled={totalBoxes === 0} onClick={go}
        className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl">
        Apply redaction ({totalBoxes} box{totalBoxes === 1 ? "" : "es"})
      </button>
    </div>
  );
}
