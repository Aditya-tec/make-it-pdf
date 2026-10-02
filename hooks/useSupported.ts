"use client";
import { useSyncExternalStore } from "react";

// Feature checks for tools whose engines need newer browser APIs. Server render assumes "supported"
// so the static HTML is unchanged; the real answer is computed once on the client.

let offscreen: boolean | undefined;
// Safari 16.0–16.3 has OffscreenCanvas but no 2d context, so check getContext too.
export const hasOffscreenCanvas2d = () =>
  (offscreen ??= (() => {
    try {
      return typeof OffscreenCanvas !== "undefined" && !!new OffscreenCanvas(1, 1).getContext("2d");
    } catch {
      return false;
    }
  })());

// qpdf's threads need SharedArrayBuffer, which needs the COOP/COEP headers in vercel.json.
export const isCrossOriginIsolated = () => self.crossOriginIsolated === true;

const subscribe = () => () => {};

export function useSupported(check: () => boolean): boolean {
  return useSyncExternalStore(subscribe, check, () => true);
}
