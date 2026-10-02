import { TOOLS } from "@/lib/tools";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// Build-time static file from the tool registry — stays in sync when tools are added.
export async function GET() {
  const toolLines = TOOLS.map((t) => `- ${t.name} — ${t.tagline}`).join("\n");
  const pageLines = TOOLS.map((t) => `- /${t.slug}`).join("\n");

  const body = `# ${SITE_NAME}

> Free, browser-only PDF tools. Files are processed entirely on the user's device using WebAssembly and Web Workers — nothing is ever uploaded to a server. No sign-up, no watermark, no file size games.

## Tools
${toolLines}

## Key facts
- All processing happens client-side (WebAssembly + Web Workers); tested with zero third-party network requests during file processing
- No account, sign-up, or email required for any tool
- No file size watermarking or feature paywalls
- ${TOOLS.length} tools available, all free
- Source: https://github.com/Aditya-tec/make-it-pdf
- Canonical site: ${SITE_URL}

## Pages
- Homepage: /
- Tools:
${pageLines}
- Guides: /blog
- Privacy Policy: /privacy
- Terms: /terms
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
