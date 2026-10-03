"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";
import QrCode from "@/components/QrCode";
import { connectTo, parseMsg, type Msg, newRoomId, openPeer, roomFromHash, roomLink, watchLost } from "@/lib/p2p/room";

const W = 1000, H = 700, MAX_GUESTS = 4, MAX_HISTORY = 5000;


const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

function paint(ctx: CanvasRenderingContext2D, m: Msg) {
  if (m.t === "clear") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    return;
  }
  ctx.strokeStyle = m.c;
  ctx.lineWidth = m.w;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.beginPath();
  const [x0, y0] = m.pts[0];
  ctx.moveTo(x0 * W, y0 * H);
  if (m.pts.length === 1) ctx.lineTo(x0 * W + 0.01, y0 * H);
  for (const [x, y] of m.pts.slice(1)) ctx.lineTo(x * W, y * H);
  ctx.stroke();
}

export default function WhiteboardTool() {
  const room = useSyncExternalStore(subscribeHash, () => roomFromHash() ?? "", () => "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const conns = useRef<DataConnection[]>([]);
  const history = useRef<Msg[]>([]);
  const role = useRef<"host" | "guest" | null>(null);
  const [state, setState] = useState<"idle" | "connecting" | "live" | "lost" | "error">("idle");
  const [link, setLink] = useState("");
  const [peers, setPeers] = useState(0);
  const [error, setError] = useState("");
  const [color, setColor] = useState("#111111");
  const [size, setSize] = useState(4);
  const stroke = useRef<{ last: number[]; pending: number[][] } | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) paint(ctx, { t: "clear" });
    return () => peerRef.current?.destroy();
  }, []);

  const ctx2d = () => canvasRef.current!.getContext("2d")!;
  const send = (m: Msg, except?: DataConnection) => {
    const s = JSON.stringify(m);
    for (const c of conns.current) if (c.open && c !== except) c.send(s);
  };
  const record = (m: Msg) => {
    if (m.t === "clear") history.current = [];
    else if (history.current.push(m) > MAX_HISTORY) history.current.shift(); // ponytail: late joiners miss the oldest strokes past the cap
  };
  const fail = (m: string) => { peerRef.current?.destroy(); setError(m); setState("error"); };

  const onIncoming = (raw: unknown, from: DataConnection) => {
    const m = parseMsg(raw);
    if (!m) return;
    paint(ctx2d(), m);
    if (role.current === "host") { record(m); send(m, from); }
  };

  const host = async () => {
    setState("connecting");
    try {
      const id = newRoomId();
      const peer = await openPeer(id);
      peerRef.current = peer;
      role.current = "host";
      setLink(roomLink(id));
      setState("live");
      peer.on("connection", (conn) => {
        if (conns.current.length >= MAX_GUESTS) return conn.close();
        conns.current.push(conn);
        watchLost(conn, () => {
          conns.current = conns.current.filter((c) => c !== conn);
          setPeers(conns.current.length);
        });
        conn.on("open", () => {
          setPeers(conns.current.length);
          for (const m of history.current) conn.send(JSON.stringify(m)); // catch the newcomer up
        });
        conn.on("data", (d) => onIncoming(d, conn));
      });
    } catch (e) {
      fail((e as Error).message);
    }
  };

  const join = async () => {
    setState("connecting");
    try {
      const peer = await openPeer(newRoomId());
      peerRef.current = peer;
      role.current = "guest";
      const conn = connectTo(peer, room, "raw");
      conns.current = [conn];
      const timer = setTimeout(() => fail("Couldn't reach the host. The link may have expired or they closed the page."), 20000);
      conn.on("open", () => { clearTimeout(timer); setState("live"); });
      conn.on("data", (d) => onIncoming(d, conn));
      watchLost(conn, () => setState("lost"));
    } catch (e) {
      fail((e as Error).message);
    }
  };

  // ---- local drawing ----
  const pos = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };
  const flush = () => {
    const s = stroke.current;
    if (!s || !s.pending.length) return;
    const m: Msg = { t: "s", c: color, w: size, pts: s.pending };
    if (role.current === "host") record(m);
    send(m);
    s.pending = [s.last];
  };
  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e);
    stroke.current = { last: p, pending: [p] };
    paint(ctx2d(), { t: "s", c: color, w: size, pts: [p] });
  };
  const move = (e: React.PointerEvent) => {
    const s = stroke.current;
    if (!s) return;
    const p = pos(e);
    paint(ctx2d(), { t: "s", c: color, w: size, pts: [s.last, p] });
    s.last = p;
    s.pending.push(p);
    if (s.pending.length >= 6) flush();
  };
  const up = () => { flush(); stroke.current = null; };
  const clear = () => {
    const m: Msg = { t: "clear" };
    paint(ctx2d(), m);
    if (role.current === "host") record(m);
    send(m);
  };

  const disclosure = (
    <p className="text-xs border-2 border-black bg-volt text-black rounded-lg p-3">
      <strong>This tool does use the network.</strong> Drawings go directly between the browsers in the room, not through our servers.
      To connect them, your browser does contact the free public PeerJS service (0.peerjs.com) and Google&apos;s public STUN servers, which can see IP addresses and a random room ID — not your drawing.
      Anyone with the link can join (up to {MAX_GUESTS} others), so share it privately. The board isn&apos;t saved anywhere; closing the host&apos;s tab ends the session.
    </p>
  );

  if (state === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center max-w-md">{error}</p>
      <button onClick={() => location.reload()} className="text-sm underline text-slate-500">Start over</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {disclosure}
      {state === "idle" && !room && <button onClick={host} className="self-start bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">Start a shared whiteboard</button>}
      {state === "idle" && room && <button onClick={join} className="self-start bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl">Join the whiteboard</button>}
      {state === "connecting" && <p role="status" className="text-sm text-slate-500">Connecting…</p>}
      {state === "lost" && <p role="alert" className="text-sm text-red-600 font-medium">Connection lost. What you draw now won&apos;t reach the others. Reload the page to rejoin.</p>}
      {state === "live" && !room && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">Share this link: <strong>keep this tab open</strong>.</p>
          <input readOnly aria-label="Share link" value={link} onFocus={(e) => e.currentTarget.select()} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono bg-white" />
          <QrCode text={link} size={128} />
          <p role="status" className="text-xs text-slate-500">{peers} other {peers === 1 ? "person" : "people"} connected</p>
        </div>
      )}
      {state === "live" && room && <p role="status" className="text-xs text-slate-500">Connected to the host.</p>}

      <div className="flex flex-wrap gap-3 items-center text-sm">
        <label>Colour <input type="color" aria-label="Pen colour" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        <label>Size <input type="range" aria-label="Pen size" min={1} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))} /></label>
        <button onClick={() => { setColor("#ffffff"); setSize(20); }} className="border-2 border-black rounded-lg px-3 py-1">Eraser</button>
        <button onClick={clear} className="border-2 border-black rounded-lg px-3 py-1">Clear for everyone</button>
        <button
          onClick={() => canvasRef.current?.toBlob((b) => {
            if (!b) return;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = "whiteboard.png";
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          })}
          className="border-2 border-black rounded-lg px-3 py-1"
        >
          Download PNG
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="Whiteboard"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="w-full max-w-3xl border-2 border-black rounded-lg bg-white touch-none cursor-crosshair"
      />
    </div>
  );
}
