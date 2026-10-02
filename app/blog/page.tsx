import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How-to PDF Guides: Free Tips & Tutorials",
  description:
    "Step-by-step guides for common PDF tasks: merge, split, compress, convert, and more. All free, no upload required.",
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <div className="max-w-4xl px-4 sm:px-8 py-12 sm:py-16">
      <span className="inline-block bg-white text-black border-2 border-black rounded-lg label-mono text-xs px-3 py-1 mb-5">
        {posts.length} guides
      </span>
      <h1 className="headline text-3xl sm:text-5xl text-white [text-shadow:3px_3px_0_rgba(0,0,0,0.55)] mb-4 break-words">How-to guides</h1>
      <p className="text-lg text-slate-300 mb-10 leading-relaxed">Free, step-by-step tutorials for every PDF task.</p>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block bg-white text-black border-2 border-black rounded-xl p-5 shadow-[3px_3px_0_rgba(255,255,255,0.7)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none hover:bg-volt transition-all duration-150"
          >
            <h2 className="font-extrabold text-lg">{post.title}</h2>
            <p className="text-sm text-slate-700 mt-1">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
