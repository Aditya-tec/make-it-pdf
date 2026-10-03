// Service worker. scripts/make-sw.mjs fills in MANIFEST after `next build` (the file list is only known then).
// In dev / before the build step MANIFEST is empty and this worker caches nothing (registration is production-only).
const MANIFEST = /*MANIFEST*/ { version: "dev", core: [], heavy: [] };
// Tools that need a live connection by design: never cached, never served offline.
const ONLINE_ONLY = ["/p2p-share/", "/whiteboard/"]; // keep in sync with lib/site.ts ONLINE_ONLY_ROUTES
const CACHE = "offlinepdf-" + MANIFEST.version;

const isOnlineOnly = (p) => ONLINE_ONLY.some((o) => p.startsWith(o));

const UNAVAILABLE = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Needs a connection</title>
<body style="font-family:system-ui;background:#161616;color:#fff;max-width:32rem;margin:4rem auto;padding:0 1rem">
<h1>This tool needs a live connection</h1><p>P2P Share and Whiteboard connect two browsers over the internet, so they can't work offline.
Every other tool still works from the cached copy.</p><p><a style="color:#b6f23a" href="/">Back to all tools</a></p>`;

self.addEventListener("install", (e) => {
  // Core only (HTML + JS/CSS/fonts). Heavy WASM/model files are cached later on request, so install stays fast.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(MANIFEST.core)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("offlinepdf-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (e) => {
  if (e.data !== "cache-heavy") return;
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      for (const url of MANIFEST.heavy) if (!(await c.match(url))) await c.add(url).catch(() => {}); // one at a time: gentle on bandwidth
    })
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname === "/sw.js") return;

  if (isOnlineOnly(url.pathname)) {
    if (req.mode === "navigate") {
      e.respondWith(fetch(req).catch(() => new Response(UNAVAILABLE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } })));
    }
    return; // everything else for these routes goes straight to the network, uncached
  }

  if (req.mode === "navigate") {
    // Network first so online users always get fresh pages; cached copy when offline.
    e.respondWith(
      fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; })
        .catch(async () => (await caches.match(req)) || (await caches.match(url.pathname)) || (await caches.match("/")) || Response.error())
    );
    return;
  }

  // Assets (hashed chunks, wasm, fonts, RSC payloads): cache first. ignoreSearch: the bundler's worker script is
  // requested as chunk.js?params=... and must hit the precached chunk.js.
  // Worker scripts carry their bootstrap config in the URL fragment (#params=...); a cached Response's own URL has no fragment,
  // and the browser would use it as the worker's location, so re-wrap it (a synthesized Response falls back to the request URL).
  const rewrap = (r) => (r && req.destination === "worker" ? new Response(r.body, r) : r);
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => rewrap(hit) || fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }))
  );
});
