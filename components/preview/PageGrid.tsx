"use client";
// ponytail: lazy IntersectionObserver rendering — no virtualization lib.
// Upgrade path: react-virtual if page count > 300 causes jank.
import { useEffect, useRef, useState, useCallback } from "react";

export interface PageItem {
  index: number;       // original 0-based page index
  rotation: number;    // 0, 90, 180, 270
  selected: boolean;
  thumbnail?: string;  // data URL
}

interface Props {
  pages: PageItem[];
  mode: "select" | "reorder" | "view";
  onToggleSelect?: (index: number) => void;
  onReorder?: (from: number, to: number) => void;
  onRotate?: (index: number) => void;
  onDelete?: (index: number) => void;
  renderPage: (index: number) => Promise<string>; // returns data URL
}

export default function PageGrid({
  pages,
  mode,
  onToggleSelect,
  onReorder,
  onRotate,
  onDelete,
  renderPage,
}: Props) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragFrom = useRef<number | null>(null);

  // Lazy-render thumbnails as they come into view
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLDivElement;
          const idx = Number(el.dataset.pageindex);
          if (isNaN(idx) || thumbnails[idx]) return;
          observerRef.current?.unobserve(el);
          try {
            const url = await renderPage(idx);
            setThumbnails((prev) => ({ ...prev, [idx]: url }));
          } catch { /* ignore */ }
        });
      },
      { rootMargin: "200px" }
    );
    cardRefs.current.forEach((el) => { if (el) observerRef.current?.observe(el); });
    return () => observerRef.current?.disconnect();
  }, [pages.length, renderPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragStart = useCallback((position: number) => {
    dragFrom.current = position;
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (dragFrom.current !== null && dragFrom.current !== position) {
      onReorder?.(dragFrom.current, position);
      dragFrom.current = position;
    }
  }, [onReorder]);

  const onDragEnd = useCallback(() => {
    dragFrom.current = null;
  }, []);

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
    >
      {pages.map((page, position) => (
        <div
          key={page.index + "-" + position}
          ref={(el) => { cardRefs.current[position] = el; }}
          data-pageindex={page.index}
          draggable={mode === "reorder"}
          onDragStart={() => onDragStart(position)}
          onDragOver={(e) => onDragOver(e, position)}
          onDragEnd={onDragEnd}
          onClick={() => mode === "select" && onToggleSelect?.(position)}
          onKeyDown={(e) => {
            if (mode === "select" && (e.key === "Enter" || e.key === " "))
              onToggleSelect?.(position);
          }}
          tabIndex={mode === "select" ? 0 : undefined}
          role={mode === "select" ? "checkbox" : undefined}
          aria-checked={mode === "select" ? page.selected : undefined}
          aria-label={`Page ${page.index + 1}`}
          className={`relative flex flex-col items-center rounded-lg border-2 overflow-hidden cursor-pointer transition-all
            ${page.selected && mode === "select"
              ? "border-indigo-500 ring-2 ring-indigo-300"
              : "border-slate-200 dark:border-slate-700 hover:border-indigo-400"
            }
            ${mode === "reorder" ? "cursor-grab active:cursor-grabbing" : ""}
            bg-white dark:bg-slate-800`}
        >
          {/* Thumbnail */}
          <div
            className="w-full aspect-[3/4] flex items-center justify-center bg-slate-100 dark:bg-slate-700"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          >
            {thumbnails[page.index] ? (
              <img
                src={thumbnails[page.index]}
                alt={`Page ${page.index + 1}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-8 h-8 animate-pulse bg-slate-300 dark:bg-slate-600 rounded" />
            )}
          </div>

          {/* Page number */}
          <span className="text-xs text-slate-500 py-1">{page.index + 1}</span>

          {/* Action buttons for reorder mode */}
          {mode === "reorder" && (
            <div className="absolute top-1 right-1 flex gap-1">
              {onRotate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRotate(position); }}
                  aria-label={`Rotate page ${page.index + 1}`}
                  className="p-1 rounded bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 shadow text-slate-600 dark:text-slate-300"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(position); }}
                  aria-label={`Delete page ${page.index + 1}`}
                  className="p-1 rounded bg-white/80 dark:bg-slate-800/80 hover:bg-red-100 dark:hover:bg-red-900 shadow text-slate-600 dark:text-red-400"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Selected check */}
          {mode === "select" && page.selected && (
            <div className="absolute top-1 left-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
