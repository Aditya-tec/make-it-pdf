// .pptx -> HTML fragment (one div per slide). The UI sanitizes it and prints it, same as Word to PDF.
// ponytail: regex over the slide XML, not a full DrawingML renderer. Group transforms, theme fonts,
// colors, bullets-as-numbers and animations are ignored. Shapes with no own position (they inherit
// from the layout) flow at the top of the slide.
import { attr, escHtml, imageMime, resolveZipPath, toBase64, unzipSafe, xmlText } from "@/lib/pdf/unzipSafe";

const MAX_SLIDES = 300;
const MAX_IMG = 10 * 1024 * 1024;
const dec = new TextDecoder();

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  onProgress(5, "Opening presentation…");
  const zip = unzipSafe(
    new Uint8Array(files[0]),
    (n) => /^ppt\/(presentation\.xml|_rels\/presentation\.xml\.rels|slides\/(_rels\/)?slide\d+\.xml(\.rels)?|media\/[^/]+)$/.test(n)
  );
  const pres = zip["ppt/presentation.xml"];
  if (!pres) throw new Error("This doesn't look like a PowerPoint (.pptx) file.");
  const presXml = dec.decode(pres);

  const sz = presXml.match(/<p:sldSz\b[^>]*>/)?.[0] ?? "";
  const cx = Number(attr(sz, "cx")) || 9144000;
  const cy = Number(attr(sz, "cy")) || 6858000;
  const W = Math.min(720, (500 * cx) / cy); // pt; fits an A4-landscape page
  const k = W / cx; // EMU -> pt
  const H = cy * k;
  const fontK = W / (cx / 12700); // slide pt -> printed pt

  const rels = new Map<string, string>();
  for (const t of dec.decode(zip["ppt/_rels/presentation.xml.rels"] ?? new Uint8Array()).match(/<Relationship\b[^>]*>/g) ?? []) {
    rels.set(attr(t, "Id") ?? "", attr(t, "Target") ?? "");
  }
  let slidePaths = [...presXml.matchAll(/<p:sldId\b[^>]*>/g)]
    .map((m) => rels.get(attr(m[0], "r:id") ?? ""))
    .filter((t): t is string => !!t)
    .map((t) => resolveZipPath("ppt/presentation.xml", t))
    .filter((p) => zip[p]);
  if (!slidePaths.length) {
    slidePaths = Object.keys(zip)
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => Number(a.match(/\d+/g)!.pop()) - Number(b.match(/\d+/g)!.pop()));
  }
  if (!slidePaths.length) throw new Error("No slides found in this file.");
  if (slidePaths.length > MAX_SLIDES) throw new Error(`This deck has ${slidePaths.length} slides; the limit is ${MAX_SLIDES}.`);

  const out: string[] = [];
  slidePaths.forEach((path, idx) => {
    onProgress(10 + Math.round((idx / slidePaths.length) * 85), `Slide ${idx + 1}/${slidePaths.length}…`);
    const xml = dec.decode(zip[path]);
    const relPath = path.replace(/slide(\d+)\.xml$/, "_rels/slide$1.xml.rels");
    const srel = new Map<string, string>();
    for (const t of dec.decode(zip[relPath] ?? new Uint8Array()).match(/<Relationship\b[^>]*>/g) ?? []) {
      srel.set(attr(t, "Id") ?? "", resolveZipPath(path, attr(t, "Target") ?? ""));
    }

    const pos: string[] = [];
    const flow: string[] = [];
    for (const m of xml.matchAll(/<p:(sp|pic)\b[\s\S]*?<\/p:\1>/g)) {
      const body = m[0];
      const off = body.match(/<a:off\b[^>]*>/)?.[0];
      const ext = body.match(/<a:ext\b[^>]*>/)?.[0];
      const box =
        off && ext
          ? `position:absolute;left:${(Number(attr(off, "x")) * k).toFixed(1)}pt;top:${(Number(attr(off, "y")) * k).toFixed(1)}pt;width:${(Number(attr(ext, "cx")) * k).toFixed(1)}pt;height:${(Number(attr(ext, "cy")) * k).toFixed(1)}pt;`
          : "";
      let inner = "";
      if (m[1] === "pic") {
        const target = srel.get(attr(body.match(/<a:blip\b[^>]*>/)?.[0] ?? "", "r:embed") ?? "");
        const mime = target ? imageMime(target) : undefined;
        const data = target ? zip[target] : undefined;
        if (mime && data && data.length <= MAX_IMG) {
          inner = `<img src="data:${mime};base64,${toBase64(data)}" alt="" style="width:100%;height:100%;object-fit:contain">`;
        }
      } else {
        const isTitle = /<p:ph\b[^>]*type="(title|ctrTitle)"/.test(body);
        inner = [...body.matchAll(/<a:p\b[\s\S]*?<\/a:p>/g)]
          .map((p) => {
            const text = [...p[0].matchAll(/<a:t\b[^>]*>([\s\S]*?)<\/a:t>/g)].map((t) => xmlText(t[1])).join("");
            if (!text.trim()) return "";
            const size = Number(p[0].match(/<a:rPr\b[^>]*\bsz="(\d+)"/)?.[1]) / 100 || (isTitle ? 32 : 18);
            const algn = p[0].match(/<a:pPr\b[^>]*\balgn="(ctr|r)"/)?.[1];
            const bullet = /<a:buChar\b/.test(p[0]) ? "\u2022 " : "";
            return `<p style="margin:0 0 2pt;font-size:${(size * fontK).toFixed(1)}pt;line-height:1.2;${isTitle || /<a:rPr\b[^>]*\bb="1"/.test(p[0]) ? "font-weight:bold;" : ""}${algn ? `text-align:${algn === "ctr" ? "center" : "right"};` : ""}">${escHtml(bullet + text)}</p>`;
          })
          .join("");
      }
      if (!inner) continue;
      if (box) pos.push(`<div style="${box}">${inner}</div>`);
      else flow.push(inner);
    }
    out.push(
      `<div style="position:relative;width:${W.toFixed(0)}pt;height:${H.toFixed(0)}pt;overflow:hidden;border:1px solid #ccc;background:#fff;page-break-after:${idx === slidePaths.length - 1 ? "auto" : "always"};break-inside:avoid;margin:0 auto 12pt">` +
        (flow.length ? `<div style="padding:20pt 30pt">${flow.join("")}</div>` : "") +
        pos.join("") +
        `</div>`
    );
  });

  onProgress(100);
  return [{ name: "converted.html", bytes: new TextEncoder().encode(out.join("")) }];
}
