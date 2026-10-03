/** Mark pixels that differ. `out` may alias `b`. Threshold skips jpeg noise. */
export function paintDiff(a: Uint8ClampedArray, b: Uint8ClampedArray, out: Uint8ClampedArray) {
  const n = Math.min(a.length, b.length, out.length);
  for (let i = 0; i < n; i += 4) {
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d > 48) {
      out[i] = 255;
      out[i + 1] = 40;
      out[i + 2] = 40;
      out[i + 3] = 255;
    } else if (out !== b) {
      out[i] = b[i];
      out[i + 1] = b[i + 1];
      out[i + 2] = b[i + 2];
      out[i + 3] = 255;
    }
  }
}
