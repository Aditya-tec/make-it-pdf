"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import Unsupported from "@/components/Unsupported";
import { useWorker } from "@/hooks/useWorker";
import { chunkText } from "@/lib/chunkText";

const hasSpeech = () => typeof window !== "undefined" && !!window.speechSynthesis;
// Snapshot is a stable string so React doesn't loop; the list itself is re-read at render.
const localVoiceKey = () => (hasSpeech() ? speechSynthesis.getVoices().filter((v) => v.localService).map((v) => v.voiceURI).join("|") : "");
const subscribeVoices = (cb: () => void) => {
  if (!hasSpeech()) return () => {};
  speechSynthesis.addEventListener("voiceschanged", cb);
  return () => speechSynthesis.removeEventListener("voiceschanged", cb);
};

export default function PdfToAudioTool() {
  const [file, setFile] = useState<File | null>(null);
  const { job, run, reset } = useWorker();
  const speechOk = useSyncExternalStore(() => () => {}, hasSpeech, () => true);
  const voiceKey = useSyncExternalStore(subscribeVoices, localVoiceKey, () => "");
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [part, setPart] = useState(0);
  const [total, setTotal] = useState(0);
  const chunks = useRef<string[]>([]);
  const idx = useRef(0);
  const live = useRef(false);

  useEffect(() => () => { if (hasSpeech()) speechSynthesis.cancel(); }, []);

  const voices = voiceKey && hasSpeech() ? speechSynthesis.getVoices().filter((v) => v.localService) : [];
  const chosen = voices.find((v) => v.voiceURI === voiceURI) ?? voices.find((v) => v.default) ?? voices[0];

  const speakFrom = (i: number) => {
    if (!live.current || i >= chunks.current.length) {
      live.current = false;
      setState("idle");
      return;
    }
    idx.current = i;
    setPart(i + 1);
    const u = new SpeechSynthesisUtterance(chunks.current[i]);
    if (chosen) u.voice = chosen;
    u.rate = rate;
    u.onend = () => speakFrom(i + 1);
    u.onerror = (e) => { if (e.error !== "canceled" && e.error !== "interrupted") speakFrom(i + 1); };
    speechSynthesis.speak(u);
  };

  const play = (text: string) => {
    if (state === "paused") {
      speechSynthesis.resume();
      setState("playing");
      return;
    }
    speechSynthesis.cancel();
    chunks.current = chunkText(text);
    setTotal(chunks.current.length);
    live.current = true;
    setState("playing");
    speakFrom(0);
  };
  const stop = () => {
    live.current = false;
    speechSynthesis.cancel();
    setState("idle");
    setPart(0);
  };
  const handleReset = () => { stop(); reset(); setFile(null); };

  if (!speechOk) return <Unsupported>This browser can&apos;t read text aloud. Try a current Chrome, Edge, Safari, or Firefox.</Unsupported>;
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{job.message}</p>
      {/scanned|OCR/i.test(job.message) && <a href="/ocr-pdf/" className="text-sm text-indigo-600 underline">Open OCR PDF tool</a>}
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  if (job.status === "done") {
    const text = new TextDecoder().decode(job.files[0].bytes);
    return (
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Listening only — there is no audio file to download, because browsers don&apos;t reliably let a page record speech synthesis.
          Only voices stored on this device are offered, so your text isn&apos;t sent to an online speech service.
        </p>
        {voices.length === 0 ? (
          <Unsupported>No offline voices are installed on this device, so this tool can&apos;t read aloud without sending text to an online voice. Install a voice in your system speech settings and reload.</Unsupported>
        ) : (
          <>
            <label className="text-sm font-medium">
              Voice
              <select
                aria-label="Voice"
                value={chosen?.voiceURI ?? ""}
                onChange={(e) => { stop(); setVoiceURI(e.target.value); }}
                className="mt-1 block w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              Speed: {rate.toFixed(1)}×
              <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="block w-48" />
            </label>
            <div className="flex gap-3 items-center">
              {state !== "playing" ? (
                <button onClick={() => play(text)} className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">{state === "paused" ? "Resume" : "Play"}</button>
              ) : (
                <button onClick={() => { speechSynthesis.pause(); setState("paused"); }} className="bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">Pause</button>
              )}
              <button onClick={stop} disabled={state === "idle"} className="border-2 border-black rounded-xl px-4 py-2 text-sm disabled:opacity-40">Stop</button>
              {state !== "idle" && <span className="text-xs text-slate-500" role="status">Part {part} of {total}</span>}
            </div>
          </>
        )}
        <button onClick={handleReset} className="self-start text-sm underline text-slate-500">Choose another PDF</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">Reads a text-based PDF aloud in this tab. Listen only — no audio download. Scanned PDFs need OCR first.</p>
      {!file ? (
        <UploadZone tool="pdf-to-audio" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <SelectedFile file={file} tool="pdf-to-audio" accept=".pdf" onClear={() => setFile(null)} onReplace={setFile} />
          <button
            onClick={async () => run({ tool: "pdf-to-audio", files: [await file.arrayBuffer()], options: {} })}
            className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            Prepare to listen
          </button>
        </>
      )}
    </div>
  );
}
