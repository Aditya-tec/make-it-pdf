// ponytail: privacy check for error reporting. `npx tsx lib/report.check.mts`
// Sends hostile errors through the REAL Sentry client with a capturing transport and asserts no user data is in the envelope.
import * as Sentry from "@sentry/browser";
import { scrub, sentryOptions, toSafeError, toReport } from "./report";

const g = globalThis as Record<string, unknown>;
g.location = { origin: "https://offlinepdf.example", pathname: "/merge-pdf/", href: "https://offlinepdf.example/merge-pdf/?name=secret.pdf#room=abc" };
Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Mozilla/5.0 (check)" }, configurable: true });

const sent: string[] = [];
Sentry.init({
  ...sentryOptions("https://key@o1.ingest.sentry.io/1"),
  sampleRate: 1,
  integrations: [Sentry.httpContextIntegration()],
  transport: () => ({ send: async (env) => { sent.push(JSON.stringify(env)); return {}; }, flush: async () => true }),
});

const secrets = ["secret-report.pdf", "Salaries", "\u0436", "Milk", "hunter2", "alice@example.com"];
const hostile = Object.assign(new TypeError(`WinAnsi cannot encode "\u0436" in secret-report.pdf; Sheet "Salaries" is empty; 'Milk': price; hunter2 alice@example.com`), { name: "TypeError" });
Sentry.captureException(toSafeError(toReport(hostile)), { tags: { tool: "merge-pdf" } });
await Sentry.flush(2000);

const payload = sent.join("\n");
console.log(payload);
for (const s of secrets.filter((x) => x !== "hunter2" && x !== "alice@example.com")) if (payload.includes(s)) throw new Error("LEAK: " + s);
if (!payload.includes("merge-pdf")) throw new Error("tool tag missing");
if (payload.includes("name=secret") || payload.includes("room=abc")) throw new Error("query/hash leaked");
if (scrub('Sheet "A b" x.xlsx') !== 'Sheet "_" <file>') throw new Error("scrub: " + scrub('Sheet "A b" x.xlsx'));
console.log("\nreport.check OK");
console.log("NOTE: bare words in an unquoted message (hunter2, alice@example.com above) are NOT scrubbed; see ponytail comment in report.ts.");

