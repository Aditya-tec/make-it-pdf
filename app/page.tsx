import Link from "next/link";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tools";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Free PDF Tools — No Upload, No Signup
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Merge, split, compress, convert and more. Every tool runs directly in
          your browser — your files never leave your device.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full px-4 py-1.5 text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          100% private · No watermark · Works offline
        </div>
      </div>

      {/* Tools by category */}
      {TOOL_CATEGORIES.map((cat) => {
        const catTools = TOOLS.filter((t) => t.category === cat.id);
        return (
          <section key={cat.id} className="mb-12">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-300">
              {cat.label}
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {catTools.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="group flex items-start gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-400 hover:shadow-md transition-all"
                >
                  <span className="text-3xl shrink-0">{tool.icon}</span>
                  <div>
                    <p className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{tool.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Trust section */}
      <section className="mt-16 bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Why use PDF Tools?</h2>
        <div className="grid sm:grid-cols-3 gap-6 mt-6 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <div className="text-3xl mb-2">🔒</div>
            <p className="font-semibold mb-1">100% Private</p>
            <p>All processing happens in your browser. Files are never sent to any server.</p>
          </div>
          <div>
            <div className="text-3xl mb-2">⚡</div>
            <p className="font-semibold mb-1">Fast &amp; Free</p>
            <p>No signup, no watermark, no file size tricks. Just PDF tools that work.</p>
          </div>
          <div>
            <div className="text-3xl mb-2">📶</div>
            <p className="font-semibold mb-1">Works Offline</p>
            <p>Once the page loads, internet is not required. Process files anywhere.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
