"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ONLINE_ONLY_ROUTES } from "@/lib/site";

// Registers the service worker (production only) and shows an offline notice.
export default function PwaClient() {
  const [online, setOnline] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    addEventListener("online", sync);
    addEventListener("offline", sync);
    return () => { removeEventListener("online", sync); removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const start = async () => {
      await navigator.serviceWorker.register("/sw.js");
      // Large WASM/model files are cached after the page has loaded and the browser is idle, never before first paint.
      (await navigator.serviceWorker.ready).active?.postMessage("cache-heavy");
    };
    const go = () => (window.requestIdleCallback ?? setTimeout)(() => void start().catch(() => {}));
    if (document.readyState === "complete") go();
    else { addEventListener("load", go, { once: true }); return () => removeEventListener("load", go); }
  }, []);

  if (online) return null;
  const onlineOnly = ONLINE_ONLY_ROUTES.some((r) => pathname.startsWith(r));
  return (
    <div role="status" className="bg-volt text-black border-b-4 border-black text-center text-sm px-4 py-2">
      {onlineOnly
        ? "You're offline. This tool needs a live connection and can't work until you reconnect."
        : "You're offline. Cached tools still work; P2P Share and Whiteboard need a connection."}
    </div>
  );
}
