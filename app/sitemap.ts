import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number) => ({
    url: `${SITE_URL}${path}${path ? "/" : ""}`, // trailingSlash: true, so this is the canonical form
    lastModified: now,
    priority,
  });
  return [
    page("", 1),
    page("/blog", 0.8),
    ...TOOLS.map((t) => page(`/${t.slug}`, 0.9)),
    ...getAllPosts().map((p) => page(`/blog/${p.slug}`, 0.7)),
    page("/privacy", 0.3),
    page("/terms", 0.3),
  ];
}
