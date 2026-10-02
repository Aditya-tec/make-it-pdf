import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  relatedTools?: string[];
}

export interface Post extends PostMeta {
  contentHtml: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Raw HTML in a .md file is escaped, never passed through.
const md = new Marked({ renderer: { html: ({ text }) => esc(text) } });

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title as string,
        excerpt: data.excerpt as string,
        relatedTools: data.relatedTools as string[] | undefined,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getPost(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title as string,
    excerpt: data.excerpt as string,
    relatedTools: data.relatedTools as string[] | undefined,
    contentHtml: md.parse(content, { async: false }),
  };
}
