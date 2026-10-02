import Link from "next/link";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import TypeSiteName from "@/components/TypeSiteName";

const STICKERS = [
  { icon: "⛔", text: "No upload. Files stay in your tab.", rot: "-rotate-2" },
  { icon: "🔑", text: "No signup. No email wall.", rot: "rotate-1" },
  { icon: "🚫", text: "No watermark. Ever.", rot: "-rotate-1" },
  { icon: "⚡", text: `${TOOLS.length} tools. All free.`, rot: "rotate-2" },
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
      <section className="px-4 sm:px-8 pt-8 pb-6 sm:pt-12 sm:pb-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-8 lg:gap-12 items-start">
        <div>
          <span className="inline-block -rotate-2 bg-white text-black border-4 border-black label-mono text-xs px-3 py-1.5 mb-6">
            100% in your browser
          </span>
          <h1 className="text-[32px] sm:text-[56px] lg:text-[76px] xl:text-[88px] [text-shadow:6px_6px_0_#000] break-words">
            <span className="headline normal-case tracking-[0.06em]! block text-white">
              <TypeSiteName />
            </span>
            <span className="headline block mt-3 sm:mt-5 text-[0.62em] leading-[1.05] text-white">
              we <span className="text-volt">never</span> see your files
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg italic text-slate-300 max-w-2xl">
            We built tools that don&apos;t need your files to work.
            <br />
            Edit, convert, and clean up your documents — 100% private, 100% free.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 lg:max-w-[320px]">
          {STICKERS.map((s) => (
            <div
              key={s.text}
              className={`${s.rot} flex items-center gap-2 sm:gap-3 bg-white text-black border-4 border-black p-2 sm:p-2.5 shadow-[5px_5px_0_#000]`}
            >
              <span
                className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-volt border-4 border-black flex items-center justify-center text-lg sm:text-xl"
                aria-hidden
              >
                {s.icon}
              </span>
              <p className="label-mono text-[10px] sm:text-xs leading-snug">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section className="px-4 sm:px-8 pt-6 pb-16 sm:pt-8 sm:pb-20" id="tools">
        {TOOL_CATEGORIES.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat.id);
          if (!catTools.length) return null;
          return (
            <div key={cat.id} className="mb-16 last:mb-0">
              <p className="label-mono text-[11px] text-volt mb-2">{catTools.length} tools</p>
              <h2 className="headline text-2xl sm:text-3xl text-white mb-6">{cat.label}</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {catTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/${tool.slug}`}
                    className="group flex items-start gap-3 bg-white text-black border-4 border-black p-3.5 shadow-[6px_6px_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-volt transition-transform"
                  >
                    <span className="w-10 h-10 shrink-0 border-4 border-black flex items-center justify-center text-xl bg-white" aria-hidden>
                      {tool.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block label-mono text-xs">{tool.name}</span>
                      <span className="block text-xs text-slate-700 mt-1">{tool.tagline}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Process blueprint */}
      <section className="px-4 sm:px-8 py-12 sm:py-16">
        <p className="label-mono text-[11px] text-volt mb-2">How it works</p>
        <h2 className="headline text-2xl sm:text-3xl text-white mb-8">Three steps</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative overflow-hidden bg-white text-black border-4 border-black shadow-[6px_6px_0_#fff] p-4 pt-10">
              <span className="absolute top-2 left-2 -rotate-3 bg-volt border-2 border-black label-mono text-[10px] px-1.5 py-0.5">
                Step 0{i + 1}
              </span>
              <h3 className="headline text-xl sm:text-2xl mb-2">{s.title}</h3>
              <p className="relative text-sm text-slate-700">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
