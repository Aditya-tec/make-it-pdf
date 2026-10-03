"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import QrCode from "@/components/QrCode";
import { connectTo, safeName, newRoomId, openPeer, roomFromHash, roomLink, watchLost } from "@/lib/p2p/room";
import { formatBytes } from "@/lib/pdf/load";
import { getToolLimits } from "@/lib/pdf/toolLimits";

const CHUNK = 16 * 1024;
const HIGH_WATER = 1024 * 1024;
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

type Phase = "idle" | "connecting" | "waiting" | "transferring" | "done" | "lost" | "error";
type Meta = { name: string; size: number };

export default function P2PShareTool() {
  const room = useSyncExternalStore(subscribeHash, () => roomFromHash() ?? "", () => "");
  const { maxFileBytes } = getToolLimits("p2p-share");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState(0);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [url, setUrl] = useState("");
  const peerRef = useRef<Peer | null>(null);
  const finished = useRef(false);

  const cleanup = () => {
    peerRef.current?.destroy();
    peerRef.current = null;
  };
  useEffect(() => cleanup, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const fail = (m: string) => { cleanup(); setMessage(m); setPhase("error"); };
  const lost = () => { if (!finished.current) { cleanup(); setPhase("lost"); } };

  const pick = (f: File | undefined) => {
    setMessage("");
    if (!f) return;
    if (f.size === 0) return setMessage(`"${f.name}" is empty.`);
    if (f.size > maxFileBytes) return setMessage(`"${f.name}" is larger than ${Math.round(maxFileBytes / 1024 / 1024)} MB for this tool.`);
    setFile(f);
  };

  // ---- sender ----
  const share = async () => {
    if (!file) return;
    finished.current = false;
    setPhase("connecting");
    try {
      const id = newRoomId();
      const peer = await openPeer(id);
      peerRef.current = peer;
      setLink(roomLink(id));
      setPhase("waiting");
      let taken = false;
      peer.on("connection", (conn) => {
        if (taken) return conn.close(); // one receiver per link
        taken = true;
        watchLost(conn, lost);
        conn.on("open", () => send(conn, file));
      });
      peer.on("disconnected", () => { if (!taken) fail("Lost the connection to the service. Start again."); });
    } catch (e) {
      fail((e as Error).message);
    }
  };

  const send = async (conn: DataConnection, f: File) => {
    setPhase("transferring");
    conn.send(JSON.stringify({ name: f.name, size: f.size }));
    const dc = conn.dataChannel;
    dc.bufferedAmountLowThreshold = CHUNK * 4;
    for (let off = 0; off < f.size; off += CHUNK) {
      if (!conn.open) return;
      if (dc.bufferedAmount > HIGH_WATER) {
        await new Promise<void>((res) => { dc.onbufferedamountlow = () => res(); setTimeout(res, 2000); });
      }
      conn.send(await f.slice(off, off + CHUNK).arrayBuffer());
      setPct(Math.round((Math.min(off + CHUNK, f.size) / f.size) * 100));
    }
    // Wait for the buffer to drain, so "done" means it actually left this device.
    while (dc.bufferedAmount > 0 && conn.open) await new Promise((r) => setTimeout(r, 100));
    if (conn.open) { finished.current = true; setPhase("done"); }
  };

  // ---- receiver ----
  const receive = async () => {
    finished.current = false;
    setPhase("connecting");
    try {
      const peer = await openPeer(newRoomId());
      peerRef.current = peer;
      const conn = connectTo(peer, room, "raw");
      const timer = setTimeout(() => fail("Couldn't reach the sender. The link may have expired or they closed the page."), 20000);
      let m: Meta | null = null;
      const parts: ArrayBuffer[] = [];
      let got = 0;
      watchLost(conn, lost);
      conn.on("open", () => { clearTimeout(timer); setPhase("transferring"); });
      conn.on("data", (d) => {
        if (!m) {
          try {
            const j = JSON.parse(String(d));
            if (!Number.isSafeInteger(j.size) || j.size <= 0) throw 0;
            if (j.size > maxFileBytes) return fail(`That file is larger than this tool's ${Math.round(maxFileBytes / 1024 / 1024)} MB limit.`);
            m = { name: safeName(j.name), size: j.size };
            setMeta(m);
          } catch {
            fail("The sender sent something unexpected. Nothing was saved.");
          }
          return;
        }
        if (!(d instanceof ArrayBuffer)) return;
        got += d.byteLength;
        if (got > m.size) return fail("More data arrived than the sender announced. Nothing was saved.");
        parts.push(d);
        setPct(Math.round((got / m.size) * 100));
        if (got === m.size) {
          finished.current = true;
          setUrl(URL.createObjectURL(new Blob(parts, { type: "application/octet-stream" })));
          setPhase("done");
          setTimeout(cleanup, 3000); // let the sender see its buffer drain before the channel closes
        }
      });
    } catch (e) {
      fail((e as Error).message);
    }
  };

  const again = () => { cleanup(); setPhase("idle"); setPct(0); setMeta(null); setUrl(""); setLink(""); setMessage(""); setFile(null); };

  const disclosure = (
    <p className="text-xs border-2 border-black bg-volt text-black rounded-lg p-3">
      <strong>This tool does use the network.</strong> File contents go directly from one browser to the other and never touch our servers or anyone else&apos;s.
      To connect the two browsers, your browser does contact the free public PeerJS service (0.peerjs.com) and Google&apos;s public STUN servers, which can see IP addresses and a random room ID — not the file or its name.
      Anyone who gets the link before your friend does can receive the file, so send it privately.
    </p>
  );

  if (phase === "error" || phase === "lost") return (
    <div className="flex flex-col gap-4 items-center py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">
        {phase === "lost" ? "Connection lost. The transfer did not finish, and nothing was saved." : message}
      </p>
      <button onClick={again} className="text-sm underline text-slate-500">Start over</button>
    </div>
  );

  // Receiver view
  if (room) return (
    <div className="flex flex-col gap-4">
      {disclosure}
      {phase === "idle" && <button onClick={receive} className="self-start bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">Connect and receive file</button>}
      {phase === "connecting" && <p role="status" className="text-sm text-slate-500">Connecting to the sender…</p>}
      {(phase === "transferring" || phase === "done") && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{meta ? `${meta.name} · ${formatBytes(meta.size)}` : "Waiting for the file…"}</p>
          <progress value={pct} max={100} aria-label="Transfer progress" className="w-full" />
          <p role="status" className="text-xs text-slate-500">{pct}%</p>
        </div>
      )}
      {phase === "done" && meta && (
        <a href={url} download={meta.name} className="self-start bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">Save {meta.name}</a>
      )}
    </div>
  );

  // Sender view
  return (
    <div className="flex flex-col gap-5">
      {disclosure}
      {phase === "idle" && (
        <>
          <label className="block">
            <span className="text-sm font-medium">Choose a file (up to {Math.round(maxFileBytes / 1024 / 1024)} MB)</span>
            <input type="file" onChange={(e) => pick(e.target.files?.[0])} className="block mt-1 text-sm" />
          </label>
          {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
          {file && (
            <button onClick={share} className="self-start bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">
              Create link for {file.name} ({formatBytes(file.size)})
            </button>
          )}
        </>
      )}
      {phase === "connecting" && <p role="status" className="text-sm text-slate-500">Setting up…</p>}
      {phase === "waiting" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm">Open this link on the other device. <strong>Keep this tab open</strong> until the transfer finishes.</p>
          <input readOnly aria-label="Share link" value={link} onFocus={(e) => e.currentTarget.select()} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono bg-white" />
          <QrCode text={link} />
          <p role="status" className="text-xs text-slate-500">Waiting for the other person to open the link…</p>
        </div>
      )}
      {(phase === "transferring" || phase === "done") && (
        <div className="flex flex-col gap-2">
          <progress value={pct} max={100} aria-label="Transfer progress" className="w-full" />
          <p role="status" className="text-sm">{phase === "done" ? "Sent. The file has left this device; check that the other person can save it." : `Sending… ${pct}%`}</p>
          {phase === "done" && <button onClick={again} className="self-start text-sm underline text-slate-500">Send another file</button>}
        </div>
      )}
    </div>
  );
}
