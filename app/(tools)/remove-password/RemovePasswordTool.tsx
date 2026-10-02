"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import { isCrossOriginIsolated, useSupported } from "@/hooks/useSupported";
import Unsupported from "@/components/Unsupported";

export default function RemovePasswordTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const { job, run, reset } = useWorker();
  const isolated = useSupported(isCrossOriginIsolated);

  const go = async () => {
    if (!file || !password) return;
    run({ tool: "remove-password", files: [await file.arrayBuffer()], options: { password } });
  };
  const handleReset = () => { reset(); setFile(null); setPassword(""); };

  if (!isolated) return (
    <Unsupported>
      Unlocking can&apos;t run here: this page didn&apos;t load in the secure, isolated mode the engine needs.
      Try reloading, or use the deployed site / e2e build. Your file has not been sent anywhere.
    </Unsupported>
  );
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
        <UploadZone accept=".pdf" onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          <p className="text-sm">Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})</p>
          <label className="text-sm max-w-sm">Current password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              className="mt-1 w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
          </label>
          <p className="text-xs text-amber-700 dark:text-amber-300 max-w-sm">
            The password is used only in your browser and is never uploaded.
          </p>
          <button disabled={!password} onClick={go}
            className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl">
            Remove Password
          </button>
        </>
      )}
    </div>
  );
}
