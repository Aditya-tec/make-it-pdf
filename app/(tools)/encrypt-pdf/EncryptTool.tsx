"use client";
import { useState } from "react";
import UploadZone from "@/components/upload/UploadZone";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { formatBytes } from "@/lib/pdf/load";
import { isCrossOriginIsolated, useSupported } from "@/hooks/useSupported";
import Unsupported from "@/components/Unsupported";

export default function EncryptTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const { job, run, reset } = useWorker();
  const isolated = useSupported(isCrossOriginIsolated);

  const mismatch = password !== confirm && confirm.length > 0;

  const handleEncrypt = async () => {
    if (!file || !password || mismatch) return;
    const buf = await file.arrayBuffer();
    run({ tool: "encrypt-pdf", files: [buf], options: { password } });
  };

  const handleReset = () => { reset(); setFile(null); setPassword(""); setConfirm(""); };

  if (!isolated) return (
    <Unsupported>
      Encryption can&apos;t run here: this page didn&apos;t load in the secure, isolated mode the encryption engine
      needs. Try reloading the page. If this keeps happening, use an up-to-date Chrome, Firefox or Safari.
      Your file has not been sent anywhere.
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
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Selected: <strong>{file.name}</strong> ({formatBytes(file.size)})
          </p>

          <div className="flex flex-col gap-3 max-w-sm">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm w-full bg-white dark:bg-slate-700 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm password</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={`border rounded-lg px-3 py-2 text-sm w-full bg-white dark:bg-slate-700 ${
                  mismatch
                    ? "border-red-400"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {mismatch && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 max-w-sm">
            ⚠️ Your password is never sent to any server. Store it safely, there is no recovery.
          </div>

          <button
            onClick={handleEncrypt}
            disabled={!password || mismatch}
            className="self-start bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Encrypt PDF
          </button>
        </>
      )}
    </div>
  );
}
