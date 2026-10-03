"use client";
import qrcode from "qrcode-generator";

/** QR as an SVG built from numbers only (no innerHTML). */
export default function QrCode({ text, size = 176 }: { text: string; size?: number }) {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return (
    <svg role="img" aria-label="QR code for the link" width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} shapeRendering="crispEdges" className="bg-white border border-slate-300 rounded">
      <path d={d} fill="#000" />
    </svg>
  );
}
