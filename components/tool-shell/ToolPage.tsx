import type { Tool } from "@/lib/tools";
import Link from "next/link";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";
import { toolJsonLd } from "@/lib/jsonld";

interface Props {
  tool: Tool;
  children: React.ReactNode; // the interactive shell
}

export default function ToolPage({ tool, children }: Props) {
  const related = tool.related
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter(Boolean) as Tool[];
  const category = TOOL_CATEGORIES.find((c) => c.id === tool.category)?.label ?? "";

  const ld = toolJsonLd(tool);

  return (
    <div className="w-full max-w-7xl px-4 sm:px-8 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-11 h-11 bg-white border-2 border-black rounded-lg flex items-center justify-center text-2xl" aria-hidden>
            {tool.icon}
          </span>
          <span className="bg-white text-black border-2 border-black rounded-md label-mono text-[11px] px-2.5 py-1">
            {category} / runs on your device
          </span>
        </div>
        <h1 className="headline text-3xl sm:text-4xl text-white [text-shadow:3px_3px_0_rgba(0,0,0,0.55)] break-words">
          {tool.name}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">{tool.tagline}</p>
      </div>

      {/* Upload stays fixed width; how-to sits further right and a bit wider */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-10 lg:gap-20 items-stretch mb-14 w-full">
        <div className="bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0_#ccff00] p-4 sm:p-5 w-full lg:w-[42rem] lg:max-w-[42rem] shrink-0">
          {children}
        </div>

        <aside className="bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0_#ccff00] p-5 sm:p-6 flex flex-col w-full lg:w-[28rem] xl:w-[30rem] shrink-0 lg:ml-auto">
          <p className="label-mono text-[11px] text-slate-500 mb-1">How it works</p>
          <h2 className="headline text-2xl mb-4">Step by step</h2>
          <ol className="space-y-3 flex-1">
            {tool.howTo.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-7 h-7 bg-volt text-black border-2 border-black rounded-md label-mono text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-800 leading-snug pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="mb-14 max-w-3xl">
        <p className="label-mono text-xs text-volt mb-2">Questions</p>
        <h2 className="headline text-2xl sm:text-3xl text-white mb-6">FAQ</h2>
        <div className="space-y-4">
          {tool.faq.map((item, i) => (
            <div key={i} className="bg-white text-black border-2 border-black rounded-xl shadow-[3px_3px_0_rgba(255,255,255,0.7)] p-4">
              <p className="label-mono text-xs mb-2">{item.q}</p>
              <p className="text-slate-700 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <p className="label-mono text-xs text-volt mb-2">Next up</p>
          <h2 className="headline text-2xl sm:text-3xl text-white mb-6">Related tools</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="flex items-center gap-3 bg-white text-black border-2 border-black rounded-xl p-4 shadow-[3px_3px_0_rgba(255,255,255,0.7)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-volt transition-all duration-150"
              >
                <span className="text-2xl" aria-hidden>{t.icon}</span>
                <span className="min-w-0">
                  <span className="block label-mono text-xs">{t.name}</span>
                  <span className="block text-xs text-slate-600 line-clamp-1">{t.tagline}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
