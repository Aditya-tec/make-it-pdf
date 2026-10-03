import { Marked } from "marked";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Raw HTML in a Markdown file is escaped, never passed through. Same parser the blog uses.
const md = new Marked({ renderer: { html: ({ text }) => esc(text) } });

export function markdownToHtml(src: string): string {
  return md.parse(src, { async: false }) as string;
}
