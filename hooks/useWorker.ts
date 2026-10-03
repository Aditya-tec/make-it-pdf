"use client";
import { useCallback, useRef, useState } from "react";
import { reportToolError, toReport } from "@/lib/report";
import type { WorkerRequest, WorkerResponse } from "@/lib/workers/pdf.worker";
import {
  deviceMemoryGb,
  getToolLimits,
  mbLabel,
  needsLowMemoryConfirm,
  OOM_USER_MESSAGE,
} from "@/lib/pdf/toolLimits";

export type JobState =
  | { status: "idle" }
  | { status: "processing"; percent: number; message: string }
  | { status: "done"; files: { name: string; bytes: Uint8Array }[]; warning?: string }
  | { status: "error"; message: string };

export function useWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [job, setJob] = useState<JobState>({ status: "idle" });

  const run = useCallback(
    (request: WorkerRequest) => {
      // Terminate previous worker if still running
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      if (request.files.length === 0) {
        setJob({ status: "error", message: "No files selected." });
        return;
      }

      const total = request.files.reduce((n, f) => n + f.byteLength, 0);
      const limits = getToolLimits(request.tool);

      for (const f of request.files) {
        if (f.byteLength > limits.maxFileBytes) {
          setJob({
            status: "error",
            message: `A file is larger than ${mbLabel(limits.maxFileBytes)} MB for this tool.`,
          });
          return;
        }
      }
      if (total > limits.maxTotalBytes) {
        setJob({
          status: "error",
          message: `Total input is over ${mbLabel(limits.maxTotalBytes)} MB. Use fewer or smaller files.`,
        });
        return;
      }

      if (needsLowMemoryConfirm(request.tool, total)) {
        const mem = deviceMemoryGb();
        const ok = window.confirm(
          `This is a large file for your device${mem != null ? ` (${mem} GB RAM)` : ""}. Processing may be slow or fail. Continue?`
        );
        if (!ok) {
          setJob({ status: "idle" });
          return;
        }
      }

      setJob({ status: "processing", percent: 0, message: "Starting…" });

      const worker = new Worker(
        new URL("../lib/workers/pdf.worker.ts", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.type === "progress") {
          setJob({ status: "processing", percent: msg.percent, message: msg.message || "" });
        } else if (msg.type === "done") {
          setJob({ status: "done", files: msg.files, warning: msg.warning });
          worker.terminate();
          workerRef.current = null;
        } else if (msg.type === "error") {
          if (msg.report) void reportToolError(request.tool, msg.report);
          setJob({ status: "error", message: msg.message || "Something went wrong." });
          worker.terminate();
          workerRef.current = null;
        }
      };

      worker.onerror = (err) => {
        const raw = err.message || "";
        void reportToolError(request.tool, toReport({ name: "WorkerCrash", message: raw }));
        // Only claim OOM when the message actually mentions memory.
        // "Script error." is a browser-masked crash (could be anything: WASM init,
        // pthread failure, network error) — don't blame file size for that.
        const isOom = /out of memory|allocation failed|Array buffer allocation|OOM/i.test(raw);
        const message = isOom
          ? OOM_USER_MESSAGE
          : raw && raw !== "Script error."
          ? raw
          : "The processing engine crashed unexpectedly. Try reloading the page, or use a different browser.";
        setJob({
          status: "error",
          message,
        });
        worker.terminate();
        workerRef.current = null;
      };

      // Transfer ownership of ArrayBuffers for zero-copy
      worker.postMessage(request, request.files);
    },
    []
  );

  const reset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setJob({ status: "idle" });
  }, []);

  return { job, run, reset };
}
