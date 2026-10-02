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
    <div className="max-w-4xl px-4 sm:px-8 py-12 sm:py-16">
      <Link href="/blog" className="btn mb-8">
        ← All guides
      </Link>
      <h1 className="headline text-5xl sm:text-7xl text-white [text-shadow:6px_6px_0_#000] mb-5 break-words">{post.title}</h1>
      <p className="text-xl italic text-slate-300 mb-10">{post.excerpt}</p>

      {/* Prose content */}
      <article
        className="prose max-w-none paper p-6 sm:p-10"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <div className="mt-16">
          <h2 className="headline text-5xl text-white mb-8">Try these tools</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {relatedTools.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="flex items-center gap-3 bg-white text-black border-4 border-black p-4 shadow-[6px_6px_0_#fff] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-volt transition-transform"
              >
                <span className="text-2xl" aria-hidden>{t.icon}</span>
                <div className="min-w-0">
                  <p className="label-mono text-xs">{t.name}</p>
                  <p className="text-xs text-slate-600 line-clamp-1">{t.tagline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
