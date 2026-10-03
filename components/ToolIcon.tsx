import type { ReactNode } from "react";

/** Bold dual-tone tool marks: coal fills + volt accents. */

const V = "#ccff00";
const K = "currentColor";

function Svg({ children, className = "w-6 h-6" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      {children}
    </svg>
  );
}

const ICONS: Record<string, (c?: string) => ReactNode> = {
  "merge-pdf": (c) => (
    <Svg className={c}>
      <rect x="4" y="6" width="14" height="18" rx="2" fill={K} opacity="0.2" />
      <rect x="10" y="4" width="14" height="18" rx="2" fill={K} />
      <rect x="14" y="11" width="6" height="2.5" rx="1" fill={V} />
      <rect x="15.75" y="9.25" width="2.5" height="6" rx="1" fill={V} />
    </Svg>
  ),
  "split-pdf": (c) => (
    <Svg className={c}>
      <rect x="3" y="5" width="11" height="22" rx="2" fill={K} />
      <rect x="18" y="5" width="11" height="22" rx="2" fill={K} />
      <rect x="14.5" y="3" width="3" height="26" rx="1.5" fill={V} />
    </Svg>
  ),
  "compress-pdf": (c) => (
    <Svg className={c}>
      <rect x="7" y="4" width="18" height="24" rx="2" fill={K} />
      <path d="M12 14h8l-2.5-3.5h-3zm0 4h8l-2.5 3.5h-3z" fill={V} />
    </Svg>
  ),
  "pdf-to-jpg": (c) => (
    <Svg className={c}>
      <rect x="3" y="5" width="14" height="20" rx="2" fill={K} />
      <rect x="15" y="9" width="14" height="14" rx="2" fill={V} stroke={K} strokeWidth="1.5" />
      <circle cx="20" cy="14" r="1.8" fill={K} />
      <path d="M16 20l3-3 2 2 3-3.5 3 4.5H16z" fill={K} />
    </Svg>
  ),
  "images-to-pdf": (c) => (
    <Svg className={c}>
      <rect x="5" y="3" width="16" height="14" rx="2" fill={V} stroke={K} strokeWidth="1.5" />
      <circle cx="11" cy="8" r="1.6" fill={K} />
      <path d="M6 14l3.5-3 2.5 2.5 2-1.8 4 4.3H6z" fill={K} />
      <rect x="9" y="12" width="16" height="16" rx="2" fill={K} />
      <rect x="13" y="17" width="8" height="2" rx="1" fill={V} />
      <rect x="13" y="21" width="5" height="2" rx="1" fill={V} />
    </Svg>
  ),
  "word-to-pdf": (c) => (
    <Svg className={c}>
      <path d="M8 3h10l6 6v18H8V3z" fill={K} />
      <path d="M18 3v6h6" fill={V} />
      <path d="M11 13h2.2l1.3 6.2L16 13h2l1.5 6.2L21 13h2.2l-2.4 10h-2.3L17 16.5 15.5 23H13.2L11 13z" fill={V} />
    </Svg>
  ),
  "organize-pages": (c) => (
    <Svg className={c}>
      <rect x="3" y="3" width="11" height="11" rx="2" fill={K} />
      <rect x="18" y="3" width="11" height="11" rx="2" fill={V} stroke={K} strokeWidth="1.5" />
      <rect x="3" y="18" width="11" height="11" rx="2" fill={V} stroke={K} strokeWidth="1.5" />
      <rect x="18" y="18" width="11" height="11" rx="2" fill={K} />
    </Svg>
  ),
  "add-watermark": (c) => (
    <Svg className={c}>
      <path d="M16 3c4.5 6 9 10.5 9 16a9 9 0 11-18 0c0-5.5 4.5-10 9-16z" fill={K} />
      <ellipse cx="16" cy="20" rx="3.5" ry="2.2" fill={V} />
    </Svg>
  ),
  "encrypt-pdf": (c) => (
    <Svg className={c}>
      <path d="M10 14V10a6 6 0 0112 0v4" fill="none" stroke={K} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="7" y="14" width="18" height="14" rx="3" fill={K} />
      <circle cx="16" cy="21" r="2.2" fill={V} />
      <rect x="15" y="21" width="2" height="4" rx="1" fill={V} />
    </Svg>
  ),
  "extract-text": (c) => (
    <Svg className={c}>
      <rect x="5" y="3" width="22" height="26" rx="3" fill={K} />
      <rect x="9" y="8" width="14" height="2.5" rx="1.2" fill={V} />
      <rect x="9" y="14" width="14" height="2.5" rx="1.2" fill={V} />
      <rect x="9" y="20" width="9" height="2.5" rx="1.2" fill={V} />
    </Svg>
  ),
  "rotate-pdf": (c) => (
    <Svg className={c}>
      <rect x="8" y="8" width="14" height="18" rx="2" fill={K} transform="rotate(-12 15 17)" />
      <path d="M24 8a10 10 0 11-3-4" fill="none" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 3v6h-6" fill="none" stroke={V} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "crop-resize": (c) => (
    <Svg className={c}>
      <path d="M8 2v18h18" fill="none" stroke={K} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 30V12H6" fill="none" stroke={K} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="11" y="11" width="12" height="12" rx="1.5" fill={V} stroke={K} strokeWidth="1.5" />
    </Svg>
  ),
  "page-numbers": (c) => (
    <Svg className={c}>
      <path d="M7 3h12l6 6v20H7V3z" fill={K} />
      <path d="M19 3v6h6" fill={V} />
      <rect x="11" y="14" width="3" height="10" rx="1" fill={V} />
      <rect x="11" y="14" width="7" height="3" rx="1" fill={V} />
      <rect x="15" y="21" width="5" height="3" rx="1" fill={V} />
    </Svg>
  ),
  "headers-footers": (c) => (
    <Svg className={c}>
      <rect x="4" y="3" width="24" height="26" rx="3" fill={K} />
      <rect x="4" y="3" width="24" height="7" rx="3" fill={V} />
      <rect x="7" y="5.5" width="10" height="2" rx="1" fill={K} />
      <rect x="4" y="22" width="24" height="7" rx="3" fill={V} />
      <rect x="7" y="24.5" width="14" height="2" rx="1" fill={K} />
    </Svg>
  ),
  "remove-password": (c) => (
    <Svg className={c}>
      <path d="M10 14V10a6 6 0 0111.5-2.3" fill="none" stroke={K} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="7" y="14" width="18" height="14" rx="3" fill={K} />
      <circle cx="16" cy="21" r="2.2" fill={V} />
      <path d="M22 7l4 4M26 7l-4 4" stroke={V} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  ),
  "ocr-pdf": (c) => (
    <Svg className={c}>
      <rect x="5" y="5" width="22" height="22" rx="3" fill={K} />
      <path d="M5 11h5M5 5h6v6M21 5h6v6h-5M27 21v6h-6M11 27H5v-6" fill="none" stroke={V} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4" fill="none" stroke={V} strokeWidth="2" />
    </Svg>
  ),
  "flatten-pdf": (c) => (
    <Svg className={c}>
      <path d="M4 10l12-6 12 6-12 6z" fill={K} opacity="0.35" />
      <path d="M4 16l12 6 12-6-12-6z" fill={K} opacity="0.6" />
      <path d="M4 22l12 6 12-6-12-6z" fill={K} />
      <rect x="12" y="20" width="8" height="2.5" rx="1" fill={V} />
    </Svg>
  ),
  "redact-pdf": (c) => (
    <Svg className={c}>
      <rect x="4" y="3" width="24" height="26" rx="3" fill={K} />
      <rect x="8" y="9" width="16" height="3.5" rx="1" fill={V} />
      <rect x="8" y="15.5" width="16" height="5" rx="1" fill="#0a0a0a" stroke={V} strokeWidth="1.5" />
      <rect x="8" y="23" width="10" height="3.5" rx="1" fill={V} />
    </Svg>
  ),
  "invert-colors": (c) => (
    <Svg className={c}>
      <circle cx="16" cy="16" r="12" fill={K} />
      <path d="M16 4a12 12 0 000 24z" fill={V} />
    </Svg>
  ),
  "privacy-scanner": (c) => (
    <Svg className={c}>
      <path d="M16 2l12 4.5v8c0 8-5.2 13.2-12 15.5C9.2 27.7 4 22.5 4 14.5v-8L16 2z" fill={K} />
      <path d="M11 16l3 3 7-7" fill="none" stroke={V} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "pdf-to-zip": (c) => (
    <Svg className={c}>
      <path d="M8 4h12v8H8z" fill={K} />
      <path d="M6 14h20v14H6z" fill={K} />
      <rect x="10" y="18" width="12" height="3" rx="1" fill={V} />
      <rect x="13" y="22" width="6" height="3" rx="1" fill={V} />
    </Svg>
  ),
  "markdown-to-pdf": (c) => (
    <Svg className={c}>
      <rect x="4" y="6" width="24" height="20" rx="2" fill={K} />
      <path d="M8 20V12l4 5 4-5v8" fill="none" stroke={V} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12v8M20 16l3 4 3-4" fill="none" stroke={V} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "html-to-pdf": (c) => (
    <Svg className={c}>
      <rect x="4" y="5" width="24" height="22" rx="2" fill={K} />
      <path d="M11 13l-3 3 3 3M21 13l3 3-3 3M14 21l4-10" fill="none" stroke={V} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "csv-to-pdf": (c) => (
    <Svg className={c}>
      <rect x="4" y="4" width="24" height="24" rx="2" fill={K} />
      <path d="M4 12h24M4 20h24M12 4v24M20 4v24" stroke={V} strokeWidth="1.6" />
    </Svg>
  ),
  "excel-to-pdf": (c) => (
    <Svg className={c}>
      <rect x="5" y="3" width="22" height="26" rx="2" fill={K} />
      <path d="M11 11l10 10M21 11L11 21" stroke={V} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  ),
  "compare-pdfs": (c) => (
    <Svg className={c}>
      <rect x="2" y="5" width="12" height="22" rx="2" fill={K} />
      <rect x="18" y="5" width="12" height="22" rx="2" fill={K} />
      <rect x="15" y="14" width="2" height="4" fill={V} />
    </Svg>
  ),
  "repair-pdf": (c) => (
    <Svg className={c}>
      <path d="M8 3h10l6 6v18H8V3z" fill={K} />
      <path d="M18 3v6h6" fill={V} />
      <path d="M12 18h8M16 14v8" stroke={V} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  ),
  "pdf-to-word": (c) => (
    <Svg className={c}>
      <path d="M6 3h12l6 6v18H6V3z" fill={K} />
      <path d="M18 3v6h6" fill={V} />
      <path d="M10 16l2 6 2-4 2 4 2-6" fill="none" stroke={V} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "create-pdf": (c) => (
    <Svg className={c}>
      <path d="M8 3h10l6 6v18H8V3z" fill={K} />
      <path d="M18 3v6h6" fill={V} />
      <path d="M12 20l6-8 2 2" fill="none" stroke={V} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "powerpoint-to-pdf": (c) => (
    <Svg className={c}>
      <rect x="3" y="6" width="26" height="17" rx="2" fill={K} />
      <path d="M16 23v5M10 28h12" stroke={K} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 11h5a3 3 0 010 6h-5z" fill="none" stroke={V} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  ),
  "pdf-to-powerpoint": (c) => (
    <Svg className={c}>
      <rect x="3" y="6" width="26" height="17" rx="2" fill={K} />
      <path d="M16 23v5M10 28h12" stroke={K} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="9" y="10" width="14" height="9" rx="1" fill={V} />
    </Svg>
  ),
  "pdf-to-excel": (c) => (
    <Svg className={c}>
      <rect x="4" y="4" width="24" height="24" rx="2" fill={K} />
      <path d="M4 12h24M12 4v24" stroke={V} strokeWidth="1.8" />
      <rect x="14" y="14" width="12" height="4" fill={V} />
    </Svg>
  ),
  "pdf-to-html": (c) => (
    <Svg className={c}>
      <rect x="4" y="5" width="24" height="22" rx="2" fill={K} />
      <path d="M13 12l-4 4 4 4M19 12l4 4-4 4" fill="none" stroke={V} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  "ebook-to-pdf": (c) => (
    <Svg className={c}>
      <path d="M4 6h10a2 2 0 012 2v20a2 2 0 00-2-2H4zM28 6H18a2 2 0 00-2 2v20a2 2 0 012-2h10z" fill={K} />
      <rect x="7" y="11" width="6" height="2" rx="1" fill={V} />
      <rect x="19" y="11" width="6" height="2" rx="1" fill={V} />
    </Svg>
  ),
  "fingerprint-pdf": (c) => (
    <Svg className={c}>
      <rect x="6" y="3" width="20" height="26" rx="3" fill={K} />
      <path d="M11 20a5 5 0 0110 0M13 24a3 3 0 016 0M16 12a4 4 0 014 4" fill="none" stroke={V} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  ),
  "pos-billing": (c) => (
    <Svg className={c}>
      <path d="M7 3h18v25l-3-2-3 2-3-2-3 2-3-2-3 2z" fill={K} />
      <rect x="11" y="9" width="10" height="2" rx="1" fill={V} />
      <rect x="11" y="14" width="10" height="2" rx="1" fill={V} />
      <rect x="11" y="19" width="6" height="2" rx="1" fill={V} />
    </Svg>
  ),
  "scan-to-pdf": (c) => (
    <Svg className={c}>
      <path d="M4 10a2 2 0 012-2h4l2-3h8l2 3h4a2 2 0 012 2v15a2 2 0 01-2 2H6a2 2 0 01-2-2z" fill={K} />
      <circle cx="16" cy="17" r="5" fill={V} />
      <circle cx="16" cy="17" r="2" fill={K} />
    </Svg>
  ),
  "p2p-share": (c) => (
    <Svg className={c}>
      <circle cx="7" cy="16" r="4" fill={K} />
      <circle cx="25" cy="16" r="4" fill={K} />
      <path d="M11 16h10M18 12l4 4-4 4" fill="none" stroke={V} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  whiteboard: (c) => (
    <Svg className={c}>
      <rect x="3" y="5" width="26" height="19" rx="2" fill={K} />
      <path d="M8 18c3-8 5 2 8-4s5 4 8-2" fill="none" stroke={V} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 28l5-4 5 4" stroke={K} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  ),
  "edit-pdf-text": (c) => (
    <Svg className={c}>
      <path d="M7 3h12l6 6v20H7z" fill={K} />
      <path d="M19 3v6h6" fill={V} />
      <path d="M11 22l1-4 8-8 3 3-8 8z" fill={V} />
    </Svg>
  ),
  "pdf-to-audio": (c) => (
    <Svg className={c}>
      <path d="M4 12h5l7-6v20l-7-6H4z" fill={K} />
      <path d="M20 11a7 7 0 010 10M23 7a12 12 0 010 18" fill="none" stroke={V} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  ),
  "pdf-to-epub": (c) => (
    <Svg className={c}>
      <path d="M6 4h8a6 6 0 016 6v18H10a4 4 0 01-4-4V4z" fill={K} />
      <path d="M14 4v20" stroke={V} strokeWidth="2" />
      <path d="M8 10h4M8 14h4" stroke={V} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  ),
};

export default function ToolIcon({
  slug,
  className = "w-6 h-6",
}: {
  slug: string;
  className?: string;
}) {
  const render = ICONS[slug];
  if (render) return <>{render(className)}</>;
  return (
    <Svg className={className}>
      <rect x="6" y="3" width="16" height="22" rx="2" fill={K} />
      <rect x="10" y="10" width="8" height="2" rx="1" fill={V} />
      <rect x="10" y="15" width="8" height="2" rx="1" fill={V} />
    </Svg>
  );
}
