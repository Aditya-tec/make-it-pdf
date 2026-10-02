import Link from "next/link";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import ToolSearch from "@/components/ToolSearch";

const STICKERS = [
  { icon: "⛔", text: "No upload. Files stay in your tab.", rot: "-rotate-2" },
  { icon: "🔑", text: "No signup. No email wall.", rot: "rotate-1" },
  { icon: "🚫", text: "No watermark. Ever.", rot: "-rotate-1" },
  { icon: "⚡", text: `${TOOLS.length} tools. All free.`, rot: "rotate-2" },
];

const COMPARE = [
  { label: "Where your file goes", old: "Uploaded to a stranger's server", next: "Stays in your browser" },
  { label: "Before you download", old: "Make an account first", next: "Nothing. Just drop it" },
  { label: "Your output", old: "Logo stamped on page one", next: "Clean file, no watermark" },
  { label: "Free plan", old: "Two files per hour", next: "Up to 100 MB per file" },
];

const STEPS = [
  { title: "Drop", text: "Drag a file in, pick it, or paste it from your clipboard." },
  { title: "Process", text: "Your own device does the work in a background worker. Nothing leaves the tab." },
  { title: "Download", text: "Rename it if you like and save the result. Close the tab and it is gone." },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="px-4 sm:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <span className="inline-block -rotate-2 bg-white text-black border-4 border-black label-mono text-xs px-3 py-1.5 mb-8">
          100% in your browser
        </span>
        <h1 className="headline text-[56px] sm:text-[110px] lg:text-[150px] xl:text-[170px] text-white [text-shadow:6px_6px_0_#000] break-words">
          PDF tools
          <br />
          that <span className="text-volt">never</span>
          <br />
          upload
        </h1>
        <p className="mt-8 text-xl sm:text-2xl italic text-slate-300 max-w-2xl">
          Merge, split, compress, OCR, redact and {TOOLS.length - 5} more. Every file stays on your device.
        </p>
        <div className="mt-10">
          <ToolSearch variant="hero" />
        </div>
      </section>

      {/* Sticker bar */}
      <section className="bg-white text-black border-y-4 border-black px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {STICKERS.map((s) => (
            <div key={s.text} className={`${s.rot} flex items-center gap-3 bg-white border-4 border-black p-3 shadow-[6px_6px_0_#000]`}>
              <span className="w-12 h-12 shrink-0 bg-volt border-4 border-black flex items-center justify-center text-xl" aria-hidden>
                {s.icon}
              </span>
              <p className="label-mono text-xs leading-snug">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="px-4 sm:px-8 py-16 sm:py-20" id="tools">
        {TOOL_CATEGORIES.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat.id);
          if (!catTools.length) return null;
          return (
            <div key={cat.id} className="mb-16 last:mb-0">
              <p className="label-mono text-xs text-volt mb-2">{catTools.length} tools</p>
              <h2 className="headline text-5xl sm:text-7xl text-white mb-8">{cat.label}</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {catTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/${tool.slug}`}
                    className="group flex items-start gap-4 bg-white text-black border-4 border-black p-4 shadow-[6px_6px_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-volt transition-transform"
                  >
                    <span className="w-12 h-12 shrink-0 border-4 border-black flex items-center justify-center text-2xl bg-white" aria-hidden>
                      {tool.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block label-mono text-sm">{tool.name}</span>
                      <span className="block text-sm text-slate-700 mt-1">{tool.tagline}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Comparison */}
      <section className="border-y-8 border-black bg-black">
        {COMPARE.map((row) => (
          <div key={row.label} className="grid md:grid-cols-2 border-b-8 border-black last:border-b-0">
            <div className="bg-black px-4 sm:px-8 py-10">
              <p className="label-mono text-xs text-slate-500 mb-3">The old way / {row.label}</p>
              <p className="headline text-4xl sm:text-6xl xl:text-[80px] text-[#475569]">{row.old}</p>
            </div>
            <div className="bg-volt text-black px-4 sm:px-8 py-10 md:border-l-8 border-black">
              <p className="label-mono text-xs mb-3">The better way / {row.label}</p>
              <p className="headline text-4xl sm:text-6xl xl:text-[80px]">{row.next}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Process blueprint */}
      <section className="px-4 sm:px-8 py-16 sm:py-24">
        <p className="label-mono text-xs text-volt mb-2">How it works</p>
        <h2 className="headline text-5xl sm:text-7xl text-white mb-12">Three steps</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative overflow-hidden bg-white text-black border-8 border-black shadow-[8px_8px_0_#fff] p-6 pt-14 min-h-64">
              <span className="absolute top-3 left-3 -rotate-3 bg-volt border-4 border-black label-mono text-xs px-2 py-1">
                Step 0{i + 1}
              </span>
              <span className="absolute -right-2 -bottom-8 headline text-[180px] opacity-[0.03] select-none" aria-hidden>
                {i + 1}
              </span>
              <h3 className="headline text-5xl mb-4">{s.title}</h3>
              <p className="relative text-slate-700">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
