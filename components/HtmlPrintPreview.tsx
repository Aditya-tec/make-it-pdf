"use client";
import { useCallback, useMemo, useRef } from "react";
import PrivacyBadge from "@/components/PrivacyBadge";
import { srcDoc } from "@/lib/pdf/sanitizeHtml";

export default function HtmlPrintPreview({
  html,
  frameTitle,
  note,
  onReset,
  resetLabel,
  extraCss,
}: {
  html: string;
  frameTitle: string;
  note: string;
  onReset: () => void;
  resetLabel: string;
  extraCss?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const doc = useMemo(() => srcDoc(html, extraCss), [html, extraCss]);
  const empty = useMemo(() => !doc.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<[^>]+>/g, "").trim(), [doc]);

  // Browsers stamp the print header/footer with the TOP document's title, not the
  // iframe's — blank it for the print call so the saved PDF doesn't carry our
  // marketing title. Restored once the dialog closes (or after a safety timeout).
  const handlePrint = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const prevTitle = document.title;
    document.title = "";
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
      window.removeEventListener("focus", restore);
    };
    window.addEventListener("afterprint", restore);
    window.addEventListener("focus", restore);
    setTimeout(restore, 15000);
    win.print();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <PrivacyBadge />
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Click <strong>Save as PDF</strong>. In the print dialog, set the destination to &ldquo;Save as PDF&rdquo;. If
        the preview shows a date or page title in the margins, open <strong>More settings</strong> in that dialog and
        turn off <strong>Headers and footers</strong> — that stamp comes from your browser&rsquo;s print feature, not
        this page.
      </p>
      <p className="text-xs text-slate-400">{note}</p>
      {empty ? (
        <p role="alert" className="text-red-600 dark:text-red-400 text-sm">
          Nothing left to print after removing unsafe markup.
        </p>
      ) : (
        <iframe
          ref={iframeRef}
          title={frameTitle}
          sandbox="allow-same-origin allow-modals"
          srcDoc={doc}
          className="w-full h-96 border border-slate-200 dark:border-slate-700 rounded-lg bg-white"
        />
      )}
      <div className="flex gap-3">
        {!empty && (
          <button
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Save as PDF (Print)
          </button>
        )}
        <button onClick={onReset} className="text-sm underline text-slate-500 self-center">
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
