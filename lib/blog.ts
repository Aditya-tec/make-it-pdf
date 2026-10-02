import fs from "fs";
import path from "path";
import matter from "gray-matter";

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

/** Very small Markdown → HTML converter — no heavy lib needed. */
function mdToHtml(md: string): string {
  return md
    // headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // inline code
    .replace(/`(.+?)`/g, "<code>$1</code>")
    // unordered list items
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // paragraphs (blank line separated)
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<h") || trimmed.startsWith("<li")) {
        // wrap consecutive <li> in <ul>
        if (trimmed.startsWith("<li")) return `<ul>${trimmed}</ul>`;
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, " ")}</p>`;
    })
    .join("\n");
}

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
    contentHtml: mdToHtml(content),
  };
}
