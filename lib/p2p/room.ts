"use client";
// One WebRTC module for P2P Share and Whiteboard. Client-only.
// Network reality (the tool pages say this too): the browser contacts the public PeerJS signaling
// service (0.peerjs.com) to find the other person, and Google's public STUN servers to learn its
// public address. Those see IP addresses and a random room ID — never file or drawing content, which
// flows directly between the two browsers.
import type Peer from "peerjs";
import type { DataConnection } from "peerjs";

export const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }];
export const ROOM_RE = /^opdf-[0-9a-f]{32}$/;

export function newRoomId(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return "opdf-" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Room ID from the URL fragment (never sent to the site's server), or null. */
export function roomFromHash(): string | null {
  const h = location.hash.slice(1);
  return ROOM_RE.test(h) ? h : null;
}

export const roomLink = (id: string) => `${location.origin}${location.pathname}#${id}`;

export async function openPeer(id: string): Promise<Peer> {
  const { default: PeerCtor } = await import("peerjs");
  return new Promise((resolve, reject) => {
    const peer = new PeerCtor(id, { config: { iceServers: ICE_SERVERS }, debug: 0 });
    const timer = setTimeout(() => {
      peer.destroy();
      reject(new Error("Couldn't reach the connection service. Check your internet connection and try again."));
    }, 15000);
    peer.on("open", () => {
      clearTimeout(timer);
      resolve(peer);
    });
    peer.on("error", (e) => {
      clearTimeout(timer);
      reject(new Error(e.type === "unavailable-id" ? "That room is already in use." : "Couldn't set up a connection. Try again."));
    });
  });
}

/** `reliable: true` is required: PeerJS defaults to an unordered channel, which scrambles file chunks. */
export function connectTo(peer: Peer, hostId: string, serialization: "raw" | "binary"): DataConnection {
  return peer.connect(hostId, { reliable: true, serialization });
}

/** Calls `onLost` once when the channel closes, errors, or ICE gives up. */
export function watchLost(conn: DataConnection, onLost: () => void): void {
  let fired = false;
  const fire = () => {
    if (!fired) {
      fired = true;
      onLost();
    }
  };
  conn.on("close", fire);
  conn.on("error", fire);
  const pc = conn.peerConnection as RTCPeerConnection | undefined;
  if (pc) {
    pc.addEventListener("iceconnectionstatechange", () => {
      if (["failed", "disconnected", "closed"].includes(pc.iceConnectionState)) fire();
    });
  }
}

export type Msg = { t: "s"; c: string; w: number; pts: number[][] } | { t: "clear" };

/** Everything from the network is untrusted: rebuild a clean Msg or drop it. */
export function parseMsg(raw: unknown): Msg | null {
  try {
    const j = JSON.parse(String(raw));
    if (j?.t === "clear") return { t: "clear" };
    if (j?.t !== "s" || typeof j.c !== "string" || !/^#[0-9a-f]{6}$/i.test(j.c)) return null;
    const w = Number(j.w);
    if (!Number.isFinite(w) || w < 1 || w > 60 || !Array.isArray(j.pts) || j.pts.length < 1 || j.pts.length > 2000) return null;
    const pts: number[][] = [];
    for (const p of j.pts) {
      if (!Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
      pts.push([Math.min(1, Math.max(0, p[0])), Math.min(1, Math.max(0, p[1]))]);
    }
    return { t: "s", c: j.c, w, pts };
  } catch {
    return null;
  }
}

/** Basename only, no control chars or path bits, bounded length. */
export function safeName(n: unknown): string {
  const s = String(n ?? "").split(/[\\/]/).pop()!.replace(/[\u0000-\u001f<>:"|?*]/g, "").replace(/^\.+/, "").trim().slice(0, 120);
  return s || "received-file";
}