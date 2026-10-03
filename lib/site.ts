// Single source of truth for the canonical URL (sitemap, robots, OG, JSON-LD).
// Set NEXT_PUBLIC_SITE_URL in Vercel once you have a custom domain; on Vercel the
// production *.vercel.app host is picked up automatically at build time.
export const SITE_NAME = "OfflinePDF";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "https://offlinepdf-woad.vercel.app"
).replace(/\/$/, "");

// Tools that need a live connection by design; excluded from the service worker (public/sw.js, scripts/make-sw.mjs).
export const ONLINE_ONLY_ROUTES = ["/p2p-share", "/whiteboard"];
