"use client";
import { useEffect, useRef, useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import Unsupported, { NEEDS_NEWER_BROWSER } from "@/components/Unsupported";
import { useWorker } from "@/hooks/useWorker";
import { hasOffscreenCanvas2d, useSupported } from "@/hooks/useSupported";
import { loadPdfForPreview } from "@/lib/pdf/render";
import { friendlyError } from "@/lib/pdf/validate";
import { pageItems, type PageItem } from "@/lib/workers/engines/textItems";
import type { PDFDocumentProxy } from "pdfjs-dist";

type PageData = { url: string; w: number; h: number; items: PageItem[] };
const SHOW_W = 700; // render width in CSS px; the overlay is percentage-based so it scales

export default function EditTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [loadError, setLoadError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [data, setData] = useState<PageData | null>(null);
  const [edits, setEdits] = useState<Record<string, { page: number; text: string; it: PageItem }>>({}); // "page:item" -> change
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const itemsRef = useRef<Record<number, PageItem[]>>({});
  const { job, run, reset } = useWorker();
  const supported = useSupported(hasOffscreenCanvas2d);

  useEffect(() => {
    if (!file) return;
    let dead = false;
    (async () => {
      try {
        if (!pdfRef.current) {
          pdfRef.current = await loadPdfForPreview(await file.arrayBuffer());
          if (dead) return;
          setPageCount(pdfRef.current.numPages);
        }
        const page = await pdfRef.current.getPage(pageIndex + 1);
        const vp = page.getViewport({ scale: 1 });
        const scaled = page.getViewport({ scale: (SHOW_W * 2) / vp.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(scaled.width);
        canvas.height = Math.round(scaled.height);
        await page.render({ canvas, viewport: scaled }).promise;
        const items = (itemsRef.current[pageIndex] ??= await pageItems(page));
        if (!dead) setData({ url: canvas.toDataURL("image/jpeg", 0.8), w: vp.width, h: vp.height, items });
      } catch (e) {
        if (!dead) { setLoadError(friendlyError(e)); setFile(null); }
      }
    })();
    return () => { dead = true; };
  }, [file, pageIndex]);

  const handleReset = () => {
    reset(); setFile(null); setEdits({}); setData(null); setPageCount(0); setPageIndex(0);
    pdfRef.current = null; itemsRef.current = {};
  };

  const apply = async () => {
    if (!file) return;
    const list = Object.values(edits)
      .filter((e) => e.text !== e.it.str)
      .map((e) => ({ page: e.page, x: e.it.x, y: e.it.y, w: e.it.w, h: e.it.h, text: e.text, family: e.it.family }));
    run({ tool: "edit-pdf-text", files: [await file.arrayBuffer()], options: { edits: list } });
  };

  if (!supported) return <Unsupported>{NEEDS_NEWER_BROWSER}</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{job.message}</p>
      <button onClick={() => reset()} className="text-sm underline text-slate-500">Back to editing</button>
    </div>
  );

  const note = (
    <p className="text-xs text-slate-500">
      <strong>An approximation, not a true text editor.</strong> Your change is drawn over a white box in a standard font (Helvetica, Times, or Courier), so the original font, spacing, and kerning are not preserved.
      The old text stays in the file underneath and can still be copied or searched — to remove text for real, use <a href="/redact-pdf/" className="underline">Redact PDF</a>.
    </p>
  );
  if (!file) return (
    <div className="flex flex-col gap-5">
      {note}
      <UploadZone tool="edit-pdf-text" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
    </div>
  );

  const count = Object.values(edits).filter((e) => e.text !== e.it.str).length;

  return (
    <div className="flex flex-col gap-4">
      {note}
      <SelectedFile file={file} tool="edit-pdf-text" onClear={handleReset} onReplace={(f) => { handleReset(); setFile(f); }} />
      <p className="text-xs text-slate-500">Click any text on the page and type to change it. Latin letters, digits, and common punctuation only.</p>
      <div className="flex items-center gap-3 text-sm">
        <button disabled={pageIndex <= 0} onClick={() => setPageIndex((i) => i - 1)} className="min-h-10 px-3 border-2 border-black rounded-lg disabled:opacity-40">Prev</button>
        <span className="tabular-nums">Page {pageIndex + 1} / {pageCount}</span>
        <button disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex((i) => i + 1)} className="min-h-10 px-3 border-2 border-black rounded-lg disabled:opacity-40">Next</button>
      </div>
      {data ? (
        <div className="relative border border-slate-300 rounded-lg overflow-hidden bg-white" style={{ maxWidth: SHOW_W, containerType: "inline-size" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.url} alt="" className="block w-full select-none" draggable={false} />
          {data.items.length === 0 && <p className="absolute inset-x-0 top-2 text-center text-xs bg-volt">No selectable text on this page (scanned?).</p>}
          {data.items.map((it, i) => (
            <input
              key={i}
              aria-label={`Text: ${it.str}`}
              value={edits[`${pageIndex}:${i}`]?.text ?? it.str}
              onChange={(e) => setEdits({ ...edits, [`${pageIndex}:${i}`]: { page: pageIndex, text: e.target.value, it } })}
              className="absolute bg-transparent hover:bg-yellow-200/40 focus:bg-white focus:outline focus:outline-2 focus:outline-indigo-500 p-0 m-0 border-0 text-black"
              style={{
                left: `${(it.x / data.w) * 100}%`,
                top: `${((data.h - it.y - it.h) / data.h) * 100}%`,
                width: `${(Math.max(it.w, it.h) / data.w) * 100}%`,
                height: `${((it.h * 1.25) / data.h) * 100}%`,
                fontSize: `${(it.h / data.w) * 100}cqw`,
                fontFamily: it.family,
                minWidth: 0,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="w-64 h-80 animate-pulse bg-slate-200" />
      )}
      <button disabled={!count} onClick={apply} className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl">
        Apply {count} edit{count === 1 ? "" : "s"}
      </button>
    </div>
  );
}
