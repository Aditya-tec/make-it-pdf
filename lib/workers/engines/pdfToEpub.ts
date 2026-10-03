import { zipFiles } from "@/lib/pdf/zip";
import { assertPageCount } from "@/lib/pdf/validate";
import { extractPageTexts } from "./extractText";

const xml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const utf8 = (s: string) => new TextEncoder().encode(s);

export async function run(
  files: ArrayBuffer[],
  _opts: Record<string, unknown>,
  onProgress: (p: number, m?: string) => void
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const pages = await extractPageTexts(files[0], onProgress);
  assertPageCount(pages.length);
  onProgress(90, "Building EPUB…");
  const id = crypto.randomUUID();
  const body = pages
    .map((t, i) => `<section><h2>Page ${i + 1}</h2><p>${xml(t)}</p></section>`)
    .join("");
  const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Converted PDF</title>
<style>body{font-family:Georgia,serif;line-height:1.5}p,h2{word-wrap:break-word;overflow-wrap:anywhere}</style>
</head><body>${body}</body></html>`;
  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Contents</title></head>
<body><nav epub:type="toc"><ol><li><a href="text.xhtml">Document</a></li></ol></nav></body></html>`;
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">urn:uuid:${id}</dc:identifier>
<dc:title>Converted PDF</dc:title><dc:language>en</dc:language>
</metadata>
<manifest>
<item id="text" href="text.xhtml" media-type="application/xhtml+xml"/>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
</manifest>
<spine><itemref idref="text"/></spine></package>`;
  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`;
  // mimetype is first and uncompressed (zipFiles stores, it does not deflate).
  const bytes = await zipFiles([
    { name: "mimetype", bytes: utf8("application/epub+zip") },
    { name: "META-INF/container.xml", bytes: utf8(container) },
    { name: "OEBPS/content.opf", bytes: utf8(opf) },
    { name: "OEBPS/nav.xhtml", bytes: utf8(nav) },
    { name: "OEBPS/text.xhtml", bytes: utf8(xhtml) },
  ]);
  onProgress(100);
  return [{ name: "book.epub", bytes }];
}
