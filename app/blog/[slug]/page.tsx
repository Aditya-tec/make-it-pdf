import type { Metadata } from "next";
import { getPost, getAllPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";
import ToolIcon from "@/components/ToolIcon";

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
      <h1 className="headline text-4xl sm:text-5xl text-white [text-shadow:3px_3px_0_rgba(0,0,0,0.55)] mb-4 break-words">{post.title}</h1>
      <p className="text-lg text-slate-300 mb-8 leading-relaxed">{post.excerpt}</p>

      {/* Prose content */}
      <article
        className="prose max-w-none paper p-6 sm:p-10"
        dangerouslySetInnerHTML={{ __html: post.contentHtml }}
      />

      {/* Related tools */}
      {relatedTools.length > 0 && (
        <div className="mt-14">
          <h2 className="headline text-3xl sm:text-4xl text-white mb-6">Try these tools</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {relatedTools.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="flex items-center gap-3 bg-white text-black border-2 border-black rounded-xl p-4 shadow-[3px_3px_0_rgba(255,255,255,0.7)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-volt transition-all duration-150"
              >
                <span className="w-10 h-10 shrink-0 border-2 border-black rounded-md flex items-center justify-center bg-white text-black shadow-[2px_2px_0_#ccff00]" aria-hidden>
                  <ToolIcon slug={t.slug} className="w-5 h-5" />
                </span>
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
