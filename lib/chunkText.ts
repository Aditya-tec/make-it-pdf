/** Chrome stalls on long speech utterances, so speak short sentence groups. */
export function chunkText(text: string, max = 220): string[] {
  const sentences = text.replace(/--- Page \d+ ---/g, "\n").match(/[^.!?\n]+[.!?]*/g) ?? [];
  const out: string[] = [];
  let cur = "";
  const push = (s: string) => {
    if ((cur + " " + s).length > max && cur) {
      out.push(cur);
      cur = s;
    } else cur = cur ? cur + " " + s : s;
  };
  for (let s of sentences.map((x) => x.trim()).filter(Boolean)) {
    while (s.length > max) {
      const cut = s.lastIndexOf(" ", max) > 0 ? s.lastIndexOf(" ", max) : max;
      push(s.slice(0, cut));
      s = s.slice(cut).trim();
    }
    if (s) push(s);
  }
  if (cur) out.push(cur);
  return out;
}
