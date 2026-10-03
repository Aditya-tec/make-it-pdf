import DOMPurify from "dompurify";

// Shared by Word, HTML, Markdown, and Create. Sanitization stays on the main thread:
// DOMPurify needs a DOM, and the iframe is sandboxed without allow-scripts.
const PRINT_STYLE = `<style>
  body { font-family: Georgia, serif; font-size: 12pt; margin: 1.5cm; line-height: 1.5; color: #000; }
  h1,h2,h3,h4 { font-family: Arial, sans-serif; line-height: 1.25; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; word-break: break-word; overflow-wrap: anywhere; vertical-align: top; }
  pre, code { font-family: ui-monospace, Consolas, monospace; font-size: 10pt; }
  pre { white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; background: #f4f4f4; padding: 8px; max-width: 100%; }
  img { max-width: 100%; height: auto; }
  @page { margin: 1.5cm; size: A4; }
</style>`;

let hooked = false;
function hook() {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
    const name = data.attrName.toLowerCase();
    const flat = String(data.attrValue || "").replace(/[\u0000-\u001F\s]+/g, "");
    if (name.startsWith("on")) data.keepAttr = false;
    else if (name === "href" || name === "xlink:href") {
      if (/^(javascript|data|vbscript|file):/i.test(flat) || flat.startsWith("//")) data.keepAttr = false;
    } else if (name === "src" || name === "poster" || name === "action") {
      // Remote src would fire a network request from the preview. data images only.
      if (!/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(flat)) data.keepAttr = false;
    } else if ((name === "style" || name === "background") && /url\s*\(|expression\s*\(|javascript:/i.test(data.attrValue || "")) {
      data.keepAttr = false;
    }
  });
}

export function sanitizeForPdf(html: string): string {
  hook();
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return DOMPurify.sanitize(body ? body[1] : html, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "link", "meta", "base", "style", "svg", "math"],
    ALLOW_DATA_ATTR: false,
  });
}

/** `extraCss` is trusted, tool-authored CSS only (never user input). */
export function srcDoc(fragment: string, extraCss = ""): string {
  const extra = extraCss ? `<style>${extraCss}</style>` : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${PRINT_STYLE}${extra}</head><body>${sanitizeForPdf(fragment)}</body></html>`;
}
