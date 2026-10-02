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
    <div className="max-w-4xl px-4 sm:px-8 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-11 h-11 bg-white border-2 border-black rounded-lg flex items-center justify-center text-2xl" aria-hidden>
            {tool.icon}
          </span>
          <span className="bg-white text-black border-2 border-black rounded-md label-mono text-[11px] px-2.5 py-1">
            {category} / runs on your device
          </span>
        </div>
        <h1 className="display-title text-white [text-shadow:3px_3px_0_rgba(0,0,0,0.55)] break-words">{tool.name}</h1>
        <p className="mt-4 text-lg sm:text-xl text-slate-300 leading-relaxed">{tool.tagline}</p>
      </div>

      <div className="bg-white text-black border-2 border-black rounded-xl shadow-[4px_4px_0_#ccff00] p-5 sm:p-8 mb-14">
        {children}
      </div>

      <section className="mb-14">
        <p className="label-mono text-xs text-volt mb-2">How it works</p>
        <h2 className="section-title text-white mb-6">Step by step</h2>
        <ol className="space-y-4">
          {tool.howTo.map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="shrink-0 w-9 h-9 bg-volt text-black border-2 border-black rounded-lg headline text-xl flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-slate-200 pt-1.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-14">
        <p className="label-mono text-xs text-volt mb-2">Questions</p>
        <h2 className="section-title text-white mb-6">FAQ</h2>
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
          <h2 className="section-title text-white mb-6">Related tools</h2>
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
