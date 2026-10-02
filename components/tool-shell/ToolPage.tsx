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
        <div className="flex items-center gap-3 mb-6">
          <span className="w-12 h-12 bg-white border-4 border-black rotate-3 flex items-center justify-center text-2xl" aria-hidden>
            {tool.icon}
          </span>
          <span className="-rotate-2 bg-white text-black border-4 border-black label-mono text-[11px] px-2.5 py-1">
            {category} / runs on your device
          </span>
        </div>
        <h1 className="headline text-6xl sm:text-8xl text-white [text-shadow:6px_6px_0_#000] break-words">{tool.name}</h1>
        <p className="mt-5 text-xl sm:text-2xl italic text-slate-300">{tool.tagline}</p>
      </div>

      <div className="bg-white text-black border-8 border-black shadow-[8px_8px_0_#ccff00] p-5 sm:p-8 mb-16">
        {children}
      </div>

      <section className="mb-16">
        <p className="label-mono text-xs text-volt mb-2">How it works</p>
        <h2 className="headline text-5xl text-white mb-8">Step by step</h2>
        <ol className="space-y-4">
          {tool.howTo.map((step, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="shrink-0 w-10 h-10 bg-volt text-black border-4 border-black headline text-2xl flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-slate-200 pt-2">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-16">
        <p className="label-mono text-xs text-volt mb-2">Questions</p>
        <h2 className="headline text-5xl text-white mb-8">FAQ</h2>
        <div className="space-y-6">
          {tool.faq.map((item, i) => (
            <div key={i} className="bg-white text-black border-4 border-black shadow-[6px_6px_0_#fff] p-4">
              <p className="label-mono text-xs mb-2">{item.q}</p>
              <p className="text-slate-700 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <p className="label-mono text-xs text-volt mb-2">Next up</p>
          <h2 className="headline text-5xl text-white mb-8">Related tools</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="flex items-center gap-3 bg-white text-black border-4 border-black p-4 shadow-[6px_6px_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-volt transition-transform"
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
