"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import SelectedFile from "@/components/upload/SelectedFile";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";

export default function CropResizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"margins" | "resize">("margins");
  const [fit, setFit] = useState<"contain" | "stretch">("contain");
  const [target, setTarget] = useState("a4");
  const [mt, setMt] = useState(5);
  const [mr, setMr] = useState(5);
  const [mb, setMb] = useState(5);
  const [ml, setMl] = useState(5);
  const { job, run, reset } = useWorker();

  const go = async () => {
    if (!file) return;
    run({
      tool: "crop-resize",
      files: [await file.arrayBuffer()],
      options: {
        mode,
        fit,
        target,
        marginTop: mt / 100,
        marginRight: mr / 100,
        marginBottom: mb / 100,
        marginLeft: ml / 100,
      },
    });
  };
  const handleReset = () => { reset(); setFile(null); };

  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-red-600 dark:text-red-400">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Try again</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {!file ? (
        <UploadZone tool="crop-resize" accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>

          <SelectedFile
            file={file}
            tool="crop-resize"
            accept=".pdf"
            onClear={() => setFile(null)}
            onReplace={setFile}
          />
          <div className="flex gap-2">
            {(["margins", "resize"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm border capitalize ${mode === m ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300"}`}>
                {m === "margins" ? "Crop margins" : "Resize pages"}
              </button>
            ))}
          </div>
          {mode === "margins" ? (
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[
                ["Top %", mt, setMt],
                ["Right %", mr, setMr],
                ["Bottom %", mb, setMb],
                ["Left %", ml, setMl],
              ].map(([label, val, set]) => (
                <label key={label as string} className="text-sm">
                  {label as string}
                  <input type="number" min={0} max={45} value={val as number}
                    onChange={(e) => (set as (n: number) => void)(Number(e.target.value))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                {["a4", "letter"].map((t) => (
                  <button key={t} onClick={() => setTarget(t)}
                    className={`px-4 py-2 rounded-lg text-sm border uppercase ${target === t ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300"}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {([
                  ["contain", "Keep aspect ratio (contain)"],
                  ["stretch", "Stretch to fill (may distort)"],
                ] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setFit(id)}
                    className={`px-3 py-2 rounded-lg text-sm border text-left ${fit === id ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button onClick={go} className="self-start bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl">
            Apply
          </button>
        </>
      )}
    </div>
  );
}
