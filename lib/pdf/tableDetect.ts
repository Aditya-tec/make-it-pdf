export type TextBox = { str: string; x: number; y: number; w: number; h: number };

const NUM = /^-?(\d{1,3}(,\d{3})+|\d+)(\.\d+)?$/;

/**
 * Best-effort table detection from positioned text: group boxes into lines by y, merge boxes that
 * touch into cells, then snap cell x-starts to shared column anchors.
 * ponytail: no ruling-line detection, no spanning cells; works on clean grid-like text only.
 */
export function boxesToRows(boxes: TextBox[]): (string | number)[][] {
  const items = boxes.filter((b) => b.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextBox[][] = [];
  for (const b of items) {
    const line = lines.find((l) => Math.abs(l[0].y - b.y) <= Math.max(2, 0.4 * b.h));
    if (line) line.push(b);
    else lines.push([b]);
  }
  lines.sort((a, b) => b[0].y - a[0].y);

  const cellsByLine = lines.map((line) => {
    line.sort((a, b) => a.x - b.x);
    const cells: { x: number; text: string }[] = [];
    let prevEnd = -Infinity;
    for (const b of line) {
      const gap = b.x - prevEnd;
      const last = cells[cells.length - 1];
      if (last && gap < Math.max(b.h, 6) * 0.9) last.text += (gap > b.h * 0.15 ? " " : "") + b.str.trim();
      else cells.push({ x: b.x, text: b.str.trim() });
      prevEnd = b.x + b.w;
    }
    return cells;
  });

  const xs = cellsByLine.flat().map((c) => c.x).sort((a, b) => a - b);
  const anchors: number[] = [];
  for (const x of xs) if (!anchors.length || x - anchors[anchors.length - 1] > 6) anchors.push(x);

  return cellsByLine.map((cells) => {
    const row: string[] = Array(anchors.length).fill("");
    for (const c of cells) {
      let col = 0;
      for (let i = 0; i < anchors.length; i++) if (anchors[i] <= c.x + 6) col = i;
      row[col] = row[col] ? row[col] + " " + c.text : c.text;
    }
    return row.map((v) => (NUM.test(v) && !/^0\d/.test(v) ? Number(v.replace(/,/g, "")) : v));
  });
}
