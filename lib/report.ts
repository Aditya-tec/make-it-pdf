// Error reporting. PRIVACY: this is the only code that talks to Sentry, and it only ever sends
// tool id + error class name + a scrubbed message + stack frames + the page path (no query/hash) + browser User-Agent.
// Never file bytes, filenames, option values or extracted text. Disabled entirely unless NEXT_PUBLIC_SENTRY_DSN is set.
// Sentry is imported lazily, so there is no extra JS and no connection unless a real error is reported.
import type { BrowserOptions } from "@sentry/browser";

export type ErrorReport = { name: string; message: string; stack?: string };

export const toReport = (err: unknown): ErrorReport => {
  const e = err as { name?: unknown; message?: unknown; stack?: unknown } | null;
  return {
    name: typeof e?.name === "string" ? e.name : "Error",
    message: typeof e?.message === "string" ? e.message : String(err),
    stack: typeof e?.stack === "string" ? e.stack : undefined,
  };
};

// Library/engine messages can echo user data (e.g. WinAnsi cannot encode "ж", Sheet "Salaries" is empty, "Milk": price...).
// Drop anything quoted, anything that looks like a filename, and non-printable-ASCII; keep the rest (numbers, wording).
// ponytail: heuristic, not a proof. Upgrade path = report only a fixed error-code allowlist.
export const scrub = (m: string) =>
  m.replace(/"[^"]*"|'[^']*'|`[^`]*`|“[^”]*”/g, '"_"')
    .replace(/\S+@\S+|\S+\.[A-Za-z0-9]{2,5}\b/g, "<file>") // filenames and emails
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, 160);

// Rebuild the error from safe parts only. Keep stack *frames* (code locations in our own bundles);
// drop every other line, because the first line of a stack repeats the raw message.
export function toSafeError({ name, message, stack }: ErrorReport) {
  const e = new Error(scrub(message));
  e.name = /^[A-Za-z]{1,40}$/.test(name) ? name : "Error";
  e.stack = `${e.name}: ${e.message}\n` + (stack ?? "").split("\n").filter((l) => /^\s+at /.test(l)).join("\n");
  return e;
}

// Whitelist rebuild: anything Sentry or an integration might attach that is not listed here is dropped.
type Ev = Parameters<NonNullable<BrowserOptions["beforeSend"]>>[0];
export const whitelist = (e: Ev): Ev => ({
  type: undefined,
  event_id: e.event_id,
  timestamp: e.timestamp,
  platform: e.platform,
  level: e.level,
  release: e.release,
  environment: e.environment,
  sdk: e.sdk,
  tags: e.tags,
  exception: e.exception,
  request: { url: location.origin + location.pathname, headers: { "User-Agent": navigator.userAgent } },
});

export const sentryOptions = (dsn: string): BrowserOptions => ({
  dsn,
  defaultIntegrations: false, // no global handlers, console/DOM/fetch breadcrumbs, or session tracking
  maxBreadcrumbs: 0,
  sampleRate: 0.5, // together with the per-session caps below, keeps one broken tool from eating the free quota
  beforeBreadcrumb: () => null,
  beforeSend: whitelist,
});

const sent = new Set<string>();
let initialised = false;
const MAX_PER_SESSION = 5;

export async function reportToolError(tool: string, r: ErrorReport) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn || process.env.NODE_ENV !== "production") return;
  const err = toSafeError(r);
  const key = `${tool}|${err.name}|${err.message}`;
  if (sent.has(key) || sent.size >= MAX_PER_SESSION) return;
  sent.add(key);
  try {
    const Sentry = await import("@sentry/browser");
    if (!initialised) { Sentry.init({ ...sentryOptions(dsn), integrations: [Sentry.httpContextIntegration()] }); initialised = true; }
    Sentry.captureException(err, { tags: { tool } });
  } catch { /* reporting must never break the tool */ }
}
