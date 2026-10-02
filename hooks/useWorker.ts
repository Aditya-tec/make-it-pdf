"use client";
import { useCallback, useRef, useState } from "react";
import type { WorkerRequest, WorkerResponse } from "@/lib/workers/pdf.worker";

export type JobState =
  | { status: "idle" }
  | { status: "processing"; percent: number; message: string }
  | { status: "done"; files: { name: string; bytes: Uint8Array }[] }
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
          setJob({ status: "done", files: msg.files });
          worker.terminate();
          workerRef.current = null;
        } else {
          setJob({ status: "error", message: msg.message });
          worker.terminate();
          workerRef.current = null;
        }
      };

      worker.onerror = (err) => {
        setJob({ status: "error", message: err.message || "Worker crashed unexpectedly." });
        worker.terminate();
        workerRef.current = null;
      };

      // Transfer ownership of ArrayBuffers for zero-copy
      const transfers = request.files.map((f) => f);
      worker.postMessage(request, transfers);
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
