export type CropBox = { x0: number; y0: number; x1: number; y1: number }; // fractions of width/height

/**
 * Find the bright "paper" rectangle in a small RGBA frame: Otsu threshold, then the span of rows and
 * columns that are mostly bright. Returns null when there is nothing worth cropping.
 * ponytail: axis-aligned only — no perspective or deskew. Add a corner-finder if skewed pages matter.
 */
export function autoCrop(data: Uint8ClampedArray, w: number, h: number): CropBox | null {
  const gray = new Uint8Array(w * h);
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < w * h; i++) {
    const g = (data[i * 4] * 77 + data[i * 4 + 1] * 150 + data[i * 4 + 2] * 29) >> 8;
    gray[i] = g;
    hist[g]++;
  }
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let wB = 0, sumB = 0, best = 0, thr = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = w * h - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; thr = t; }
  }
  const rows = new Array<number>(h).fill(0);
  const cols = new Array<number>(w).fill(0);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (gray[y * w + x] > thr) { rows[y]++; cols[x]++; }
  const rowOk = (y: number) => rows[y] >= w * 0.25;
  const colOk = (x: number) => cols[x] >= h * 0.25;
  let y0 = 0, y1 = h - 1, x0 = 0, x1 = w - 1;
  while (y0 < h && !rowOk(y0)) y0++;
  while (y1 > y0 && !rowOk(y1)) y1--;
  while (x0 < w && !colOk(x0)) x0++;
  while (x1 > x0 && !colOk(x1)) x1--;
  if (y0 >= y1 || x0 >= x1) return null;
  const area = ((x1 - x0 + 1) * (y1 - y0 + 1)) / (w * h);
  if (area < 0.2 || area > 0.94) return null;
  const pad = 0.01;
  return {
    x0: Math.max(0, x0 / w - pad),
    y0: Math.max(0, y0 / h - pad),
    x1: Math.min(1, (x1 + 1) / w + pad),
    y1: Math.min(1, (y1 + 1) / h + pad),
  };
}
