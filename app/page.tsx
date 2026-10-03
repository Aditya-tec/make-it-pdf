import Link from "next/link";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import TypeSiteName from "@/components/TypeSiteName";
import ToolIcon from "@/components/ToolIcon";

const STICKERS = [
  {
    text: "No upload. Files stay in your tab.",
    rot: "-rotate-2",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden>
        <path d="M16 2l12 4.5v8c0 8-5.2 13.2-12 15.5C9.2 27.7 4 22.5 4 14.5v-8L16 2z" fill="currentColor" />
        <path d="M11 16h10" stroke="#ccff00" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    text: "No signup. No email wall.",
    rot: "rotate-1",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden>
        <circle cx="16" cy="11" r="5" fill="currentColor" />
        <path d="M6 28c2-7 6-10 10-10s8 3 10 10" fill="currentColor" />
        <circle cx="16" cy="11" r="2" fill="#ccff00" />
      </svg>
    ),
  },
  {
    text: "No watermark. Ever.",
    rot: "-rotate-1",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden>
        <circle cx="16" cy="16" r="12" fill="currentColor" />
        <path d="M8 8l16 16" stroke="#ccff00" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    text: `${TOOLS.length} tools. All free.`,
    rot: "rotate-2",
    icon: (
      <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden>
        <path d="M17 2L6 18h8l-1 12 13-16h-8z" fill="currentColor" />
        <path d="M17 2l-2 8h6z" fill="#ccff00" />
      </svg>
    ),
  },
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
      <section className="px-3 sm:px-8 pt-6 pb-5 sm:pt-12 sm:pb-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-6 sm:gap-8 lg:gap-12 items-start">
        <div className="min-w-0">
          <span className="inline-block -rotate-2 bg-white text-black border-2 sm:border-4 border-black label-mono text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 mb-4 sm:mb-6">
            100% in your browser
          </span>
          <h1 className="text-[clamp(1.75rem,8vw,5.5rem)] sm:text-[56px] lg:text-[76px] xl:text-[88px] [text-shadow:4px_4px_0_#000] sm:[text-shadow:6px_6px_0_#000] break-words">
            <span className="headline normal-case tracking-[0.06em]! block text-white max-w-full overflow-x-clip">
              <TypeSiteName />
            </span>
            <span className="headline block mt-2 sm:mt-5 text-[0.62em] leading-[1.05] text-white">
              we <span className="text-volt">never</span> see your files<span className="inline-block ml-[0.18em] animate-[mark-blink_0.9s_steps(1,end)_infinite]">!</span>
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 text-sm sm:text-lg italic text-slate-300 max-w-2xl leading-relaxed">
            We built tools that don&apos;t need your files to work.
            <br className="hidden sm:block" />
            {" "}Edit, convert, and clean up your documents. Processes files entirely in your browser — tested with zero third-party network requests during file processing. {TOOLS.length} tools, no account required, no feature behind a paywall.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 lg:max-w-[320px]">
          {STICKERS.map((s) => (
            <div
              key={s.text}
              className={`${s.rot} flex items-center gap-2 sm:gap-3 bg-white text-black border-4 border-black p-2 sm:p-2.5 shadow-[5px_5px_0_#000]`}
            >
              <span
                className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 bg-white text-black border-4 border-black flex items-center justify-center shadow-[3px_3px_0_#ccff00]"
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
      <section className="px-3 sm:px-8 pt-4 pb-12 sm:pt-8 sm:pb-20" id="tools">
        {TOOL_CATEGORIES.map((cat) => {
          const catTools = TOOLS.filter((t) => t.category === cat.id);
          if (!catTools.length) return null;
          return (
            <div key={cat.id} className="mb-10 sm:mb-16 last:mb-0">
              <p className="label-mono text-[11px] text-volt mb-2">{catTools.length} tools</p>
              <h2 className="headline text-xl sm:text-3xl text-white mb-4 sm:mb-6">{cat.label}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                {catTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/${tool.slug}`}
                    className="group flex items-start gap-3 bg-white text-black border-2 sm:border-4 border-black p-3 sm:p-3.5 shadow-[4px_4px_0_#fff] sm:shadow-[6px_6px_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-volt transition-transform"
                  >
                    <span className="w-11 h-11 shrink-0 border-4 border-black flex items-center justify-center bg-white text-black shadow-[3px_3px_0_#ccff00] group-hover:shadow-none transition-shadow" aria-hidden>
                      <ToolIcon slug={tool.slug} className="w-6 h-6" />
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
