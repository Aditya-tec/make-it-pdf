import { TOOLS, type Tool } from "@/lib/tools";

/** Intent phrases per tool. Pure local matching: no network, no AI. */
const KEYWORDS: Record<string, string> = {
  "merge-pdf": "merge combine join stitch concatenate append put together one single multiple files into one attach",
  "split-pdf": "split separate divide extract pages cut break apart pick pages page range chop part",
  "compress-pdf": "compress shrink smaller reduce size make smaller lighter lightweight too big large email optimize minimize file size mb kb heavy",
  "pdf-to-jpg": "jpg jpeg png image images picture photo convert to image export images screenshot pdf to jpg save as image",
  "images-to-pdf": "images to pdf photos pictures jpg png jpeg gallery scan photos camera make pdf from images",
  "word-to-pdf": "word docx doc document microsoft office convert word to pdf",
  "organize-pages": "organize organise reorder rearrange delete pages remove pages sort move pages duplicate pages reverse order",
  "add-watermark": "watermark stamp brand branding logo confidential draft overlay text on pages mark",
  "encrypt-pdf": "encrypt password protect lock secure protection add password set password private restrict safe",
  "extract-text": "extract text copy text get text plain text txt read text content words selectable",
  "rotate-pdf": "rotate turn flip upside down sideways landscape portrait orientation wrong way straighten",
  "crop-resize": "crop resize margins trim page size a4 letter cut edges whitespace white border dimensions",
  "page-numbers": "page numbers number pages numbering pagination add numbers count pages",
  "headers-footers": "header footer headers footers top bottom text date title on every page",
  "remove-password": "unlock decrypt remove password open protected forgot password unprotect strip password unlocked",
  "ocr-pdf": "ocr scan scanned searchable recognize recognise text scanned document image to text make searchable selectable handwriting",
  "flatten-pdf": "flatten bake forms form fields annotations fill form lock form fields uneditable non editable",
  "redact-pdf": "redact black out blackout censor hide text hide info remove sensitive cover blur confidential names secret",
  "invert-colors": "invert colors colours dark mode night grayscale greyscale gray grey black and white sepia negative black white ink saving",
  "privacy-scanner": "privacy metadata strip info exif author remove metadata anonymize anonymise scrub clean hidden data tracking scanner",
  "pdf-to-zip": "zip archive bundle pages images download all pages jpg jpeg together one file",
  "markdown-to-pdf": "markdown md readme to pdf commonmark notes",
  "html-to-pdf": "html webpage markup to pdf paste html file print",
  "csv-to-pdf": "csv comma separated spreadsheet export table to pdf rows",
  "excel-to-pdf": "excel xlsx xls spreadsheet sheet workbook to pdf",
  "compare-pdfs": "compare diff difference side by side visual two pdfs changed pixels highlight",
  "repair-pdf": "repair fix broken corrupt damaged unreadable recover salvage rebuild pdf",
  "pdf-to-word": "pdf to word pdf to doc convert pdf into word export word from pdf",
  "create-pdf": "create write new pdf blank editor rich text letter note make a pdf from scratch",
  "pdf-to-epub": "epub ebook ebook reader kindle text pdf to epub",
  "powerpoint-to-pdf": "powerpoint pptx ppt slides slideshow presentation deck keynote convert powerpoint to pdf",
  "pdf-to-powerpoint": "pdf to powerpoint pptx slides slideshow presentation deck convert pdf into slides",
  "pdf-to-excel": "pdf to excel xlsx spreadsheet table tables extract table rows columns convert pdf into excel",
  "pdf-to-html": "pdf to html webpage web page markup selectable text convert pdf into html",
  "ebook-to-pdf": "ebook epub book reader convert epub to pdf kindle ereader",
  "fingerprint-pdf": "fingerprint trace leak track copies unique id recipient deterrent invisible mark",
  "pos-billing": "pos billing receipt bill shop cart gst tax thermal printer cash register retail invoice",
  "scan-to-pdf": "scan camera webcam scanner photograph document paper pages phone capture to pdf",
  "p2p-share": "p2p peer share send file transfer webrtc direct qr link beam airdrop",
  "whiteboard": "whiteboard draw drawing sketch collaborate collaborative canvas board together live",
  "edit-pdf-text": "edit pdf text change text modify words retype correct typo replace text rewrite",
  "pdf-to-audio": "audio listen read aloud speak speech text to speech narrate voice tts",
};

const STOP = new Set(
  "a an the my me i we you your our it its this that these those to of in on for from with into by at as is are be can could would should will want need wanna gonna please pls hey hi how do does did make makes making get got give let lets just some any all and or but so if then than too very really thing stuff something help using use pdf pdfs file files online free tool tools".split(" "),
);
// Words that look like stopwords but carry intent only inside a phrase are handled by KEYWORDS.

function norm(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

/** Cheap stemmer: compressing -> compress, pages -> page, locked -> lock. */
function stem(w: string): string {
  if (w.length <= 3) return w;
  return w
    .replace(/(ing|ed|es|s)$/, (m) => (w.length - m.length >= 3 ? "" : m))
    .replace(/e$/, "")
    .replace(/(.)\1$/, "$1");
}

function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) d[i] = [i];
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length]; // Damerau: a swapped pair of letters costs 1
}

/** Similarity of a query token to a vocabulary token: 0..1. */
function sim(q: string, v: string): number {
  if (q === v) return 1;
  const qs = stem(q);
  const vs = stem(v);
  if (qs === vs) return 0.95;
  if (q.length >= 3 && v.startsWith(q)) return 0.85; // live typing: "comp" -> compress
  if (q.length >= 4 && vs.startsWith(qs)) return 0.8;
  if (q.length < 4) return 0;
  const max = q.length >= 8 ? 2 : 1;
  const d = lev(qs, vs, max);
  return d <= max ? 0.7 - 0.1 * (d - 1) : 0;
}

type Entry = { tool: Tool; strong: string[]; weak: string[]; phrases: string };
let INDEX: Entry[] | null = null;
function index(): Entry[] {
  return (INDEX ??= TOOLS.map((tool) => ({
    tool,
    strong: [...new Set([...norm(tool.name), ...norm(KEYWORDS[tool.slug] || "")])].filter((w) => !STOP.has(w)),
    weak: [...new Set(norm(`${tool.tagline} ${tool.description} ${tool.category}`))].filter((w) => !STOP.has(w) && w.length > 3),
    phrases: " " + norm(`${tool.name} ${KEYWORDS[tool.slug] || ""}`).join(" ") + " ",
  })));
}

export type Match = { tool: Tool; score: number };

/** Ranked matches for a free-text request. Empty array when nothing plausible. */
export function rankTools(query: string, limit = 8): Match[] {
  const all = norm(query);
  const words = all.filter((w) => !STOP.has(w));
  if (!all.length) return [];
  // Only generic words ("pdf", "my file", "free tool"): no intent yet, so browse the first tools (never auto-jump).
  if (!words.length) return TOOLS.slice(0, limit).map((tool) => ({ tool, score: 1 }));
  const qs = words;

  const out: Match[] = [];
  for (const e of index()) {
    let score = 0;
    let hit = 0;
    for (const w of qs) {
      let best = 0;
      for (const v of e.strong) best = Math.max(best, sim(w, v) * 3);
      if (best < 2.4) for (const v of e.weak) best = Math.max(best, sim(w, v) * 1);
      if (best > 0) hit++;
      score += best;
    }
    if (!score) continue;
    score += (hit / qs.length) * 2; // coverage: matching more of the sentence wins
    // Bigram bonus: consecutive query words that also appear consecutively in the tool phrases.
    // Uses all tokens (incl. "pdf", "to") so direction counts: "pdf to png" != "png to pdf".
    for (let i = 0; i + 1 < all.length; i++) {
      if (e.phrases.includes(` ${all[i]} ${all[i + 1]} `)) score += 3;
    }
    if (norm(e.tool.name).some((n) => qs.includes(n))) score += 1;
    out.push({ tool: e.tool, score });
  }
  out.sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name));
  const top = out[0]?.score ?? 0;
  // Drop long tails of weak matches relative to the leader.
  return out.filter((m) => m.score >= top * 0.35).slice(0, limit);
}

/** True when the top result clearly beats the runner-up, so Enter can jump straight there. */
export function isConfident(m: Match[]): boolean {
  return m.length === 1 || (m.length > 1 && m[0].score >= m[1].score * 1.25);
}
