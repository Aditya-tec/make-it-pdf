import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

const BASE = "https://pdftools.vercel.app";

// Blog slugs — must match filenames in content/blog/
const BLOG_SLUGS = [
  "how-to-merge-pdf-files-free",
  "how-to-split-pdf-free",
  "how-to-compress-pdf-free",
  "how-to-convert-pdf-to-jpg-free",
  "how-to-convert-images-to-pdf-free",
  "how-to-convert-word-to-pdf-free",
  "how-to-organize-pdf-pages-free",
  "how-to-add-watermark-to-pdf-free",
  "how-to-password-protect-pdf-free",
  "how-to-extract-text-from-pdf-free",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes: MetadataRoute.Sitemap = TOOLS.map((t) => ({
    url: `${BASE}/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...toolRoutes,
    ...blogRoutes,
  ];
}
