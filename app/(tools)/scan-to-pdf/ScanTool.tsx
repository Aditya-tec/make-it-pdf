"use client";
import { useEffect, useRef, useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { autoCrop } from "@/lib/pdf/autoCrop";

const MAX_PAGES = 50;
type Shot = { url: string; bytes: ArrayBuffer };

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));

export default function ScanTool() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<"off" | "starting" | "on" | "denied" | "none">("off");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [shots, setShots] = useState<Shot[]>([]);
  const [autoCropOn, setAutoCropOn] = useState(true);
  const [error, setError] = useState("");
  const { job, run, reset } = useWorker();

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCam("off");
  };
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const start = async (mode = facing) => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (!navigator.mediaDevices?.getUserMedia) return setCam("none");
    setCam("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = s;
      setFacing(mode);
      setCam("on");
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = s;
      });
    } catch (e) {
      setCam((e as DOMException).name === "NotFoundError" || (e as DOMException).name === "OverconstrainedError" ? "none" : "denied");
    }
  };

  const capture = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || shots.length >= MAX_PAGES) return;
    const full = document.createElement("canvas");
    full.width = v.videoWidth;
    full.height = v.videoHeight;
    full.getContext("2d")!.drawImage(v, 0, 0);
    let out = full;
    if (autoCropOn) {
      // Detect on a 160px-wide copy, crop the full frame.
      const sw = 160, sh = Math.round((160 * full.height) / full.width);
      const small = document.createElement("canvas");
      small.width = sw;
      small.height = sh;
      const sctx = small.getContext("2d")!;
      sctx.drawImage(full, 0, 0, sw, sh);
      const box = autoCrop(sctx.getImageData(0, 0, sw, sh).data, sw, sh);
      if (box) {
        const x = Math.round(box.x0 * full.width), y = Math.round(box.y0 * full.height);
        const w = Math.round((box.x1 - box.x0) * full.width), h = Math.round((box.y1 - box.y0) * full.height);
        out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        out.getContext("2d")!.drawImage(full, x, y, w, h, 0, 0, w, h);
      }
    }
    const blob = await toBlob(out);
    if (!blob) return setError("Couldn't capture that frame. Try again.");
    const bytes = await blob.arrayBuffer();
    setShots((s) => [...s, { url: URL.createObjectURL(blob), bytes }].slice(0, MAX_PAGES));
  };

  const addFiles = async (files: File[]) => {
    const next: Shot[] = [];
    for (const f of files) next.push({ url: URL.createObjectURL(f), bytes: await f.arrayBuffer() });
    setShots((s) => [...s, ...next].slice(0, MAX_PAGES));
  };

  const build = () => {
    setError("");
    stop();
    // Copy each buffer: useWorker transfers them, and we may want to rebuild after an error.
    run({ tool: "scan-to-pdf", files: shots.map((s) => s.bytes.slice(0)), options: { pageSize: "fit" } });
  };
  const handleReset = () => {
    shots.forEach((s) => URL.revokeObjectURL(s.url));
    reset(); setShots([]); stop();
  };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center">{job.message}</p>
      <button onClick={() => reset()} className="text-sm underline text-slate-500">Back to pages</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">
        Photos stay in this tab — nothing is uploaded. Auto-crop trims the background around a bright page (straight crop only; it does not straighten tilted or curved pages).
      </p>

      {cam === "off" && (
        <button onClick={() => start()} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">Start camera</button>
      )}
      {cam === "starting" && <p role="status" className="text-sm text-slate-500">Waiting for camera permission…</p>}
      {(cam === "denied" || cam === "none") && (
        <div role="alert" className="bg-volt text-black border-2 border-black rounded-xl p-4 text-sm font-medium">
          {cam === "denied"
            ? "Camera access was blocked. Allow the camera for this site in your browser's address bar, then try again — or pick photos below instead."
            : "No camera was found on this device. Pick photos of your pages below instead."}
          <div className="mt-2"><button onClick={() => start()} className="underline">Try the camera again</button></div>
        </div>
      )}
      {cam === "on" && (
        <div className="flex flex-col gap-3">
          <video ref={videoRef} autoPlay playsInline muted className="w-full max-w-xl rounded-lg bg-black" />
          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={capture} disabled={shots.length >= MAX_PAGES} className="bg-indigo-600 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl">Capture page</button>
            <button onClick={() => start(facing === "environment" ? "user" : "environment")} className="border-2 border-black rounded-xl px-4 py-2 text-sm">Switch camera</button>
            <button onClick={stop} className="text-sm underline text-slate-500">Stop camera</button>
            <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={autoCropOn} onChange={(e) => setAutoCropOn(e.target.checked)} />Auto-crop</label>
          </div>
        </div>
      )}

      {shots.length < MAX_PAGES && (
        <UploadZone tool="scan-to-pdf" accept=".jpg,.jpeg,.png,.webp" multiple onFiles={addFiles} label="Or choose photos" />
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {shots.length > 0 && (
        <>
          <ul className="flex flex-wrap gap-3">
            {shots.map((s, i) => (
              <li key={s.url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt={`Page ${i + 1}`} className="h-28 rounded border border-slate-300" />
                <span className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 rounded">{i + 1}</span>
                <button aria-label={`Remove page ${i + 1}`} onClick={() => { URL.revokeObjectURL(s.url); setShots(shots.filter((_, j) => j !== i)); }} className="absolute top-1 right-1 bg-white border border-black rounded px-1 text-xs">✕</button>
              </li>
            ))}
          </ul>
          <button onClick={build} className="self-start bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">
            Make PDF ({shots.length} page{shots.length === 1 ? "" : "s"})
          </button>
        </>
      )}
    </div>
  );
}
