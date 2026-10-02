import type { Tool } from "@/lib/tools";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import { toolJsonLd } from "@/lib/jsonld";

interface Props {
  tool: Tool;
  children: React.ReactNode; // the interactive shell
}

export default function ToolPage({ tool, children }: Props) {
  const related = tool.related
    .map((slug) => TOOLS.find((t) => t.slug === slug))
    .filter(Boolean) as Tool[];

  const ld = toolJsonLd(tool);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">{tool.icon}</div>
        <h1 className="text-3xl font-bold">{tool.name}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg">{tool.tagline}</p>
      </div>

      {/* Interactive section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-12">
        {children}
      </div>

      {/* How-to */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">How to {tool.name.toLowerCase()} — step by step</h2>
        <ol className="space-y-3">
          {tool.howTo.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-7 h-7 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-slate-600 dark:text-slate-300 pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {tool.faq.map((item, i) => (
            <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="font-medium mb-1">{item.q}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related tools */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{t.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
