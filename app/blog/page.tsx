import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How-to PDF Guides — Free Tips & Tutorials",
  description:
    "Step-by-step guides for common PDF tasks: merge, split, compress, convert, and more — all free, no upload required.",
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">How-to PDF Guides</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Free, step-by-step tutorials for every PDF task.
      </p>
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all"
          >
            <h2 className="font-semibold text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {post.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
