import type { Metadata } from "next";
import { getPost, getAllPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: "article" },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const relatedTools = (post.relatedTools ?? [])
    .map((s: string) => TOOLS.find((t) => t.slug === s))
    .filter(Boolean) as typeof TOOLS;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/blog" className="text-sm text-slate-400 hover:text-indigo-600 mb-6 inline-block">
        ← All guides
      </Link>
      <h1 className="text-3xl font-bold mb-3">{post.title}</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">{post.excerpt}</p>

      {/* Prose content */}
      <article
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <div className="mt-12 border-t border-slate-200 dark:border-slate-700 pt-8">
          <h2 className="text-xl font-semibold mb-4">Try these tools</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {relatedTools.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-400 transition-colors"
              >
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{t.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
