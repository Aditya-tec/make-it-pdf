// Receipt maths in integer paise (no float drift). Simplified on purpose — see the tool page.
// ponytail: one GST rate per line, CGST/SGST split in half (odd paisa goes to SGST), no HSN codes,
// no cess, no per-invoice rounding rules. A real tax invoice needs a compliance product.
export type PosItem = { name: string; price: number; qty: number; gst: number };

export type PosLine = { name: string; qty: number; unit: number; rate: number; taxable: number; gst: number; total: number };

export type PosTotals = {
  lines: PosLine[];
  taxable: number;
  gst: number;
  total: number;
  slabs: { rate: number; taxable: number; gst: number; cgst: number; sgst: number }[];
};

export function validateItems(items: PosItem[]): void {
  if (!Array.isArray(items) || !items.length) throw new Error("Add at least one item to the cart.");
  if (items.length > 200) throw new Error("A receipt can hold up to 200 lines.");
  for (const it of items) {
    if (!String(it.name).trim() || String(it.name).length > 60) throw new Error("Each item needs a name of up to 60 characters.");
    if (!Number.isFinite(it.price) || it.price < 0 || it.price > 10_000_000) throw new Error(`"${it.name}": price must be between 0 and 10,000,000.`);
    if (!Number.isInteger(it.qty) || it.qty < 1 || it.qty > 9999) throw new Error(`"${it.name}": quantity must be a whole number from 1 to 9999.`);
    if (!Number.isFinite(it.gst) || it.gst < 0 || it.gst > 100) throw new Error(`"${it.name}": GST % must be between 0 and 100.`);
  }
}

export function calc(items: PosItem[], inclusive: boolean): PosTotals {
  validateItems(items);
  const lines = items.map((it): PosLine => {
    const unit = Math.round(it.price * 100);
    const gross = unit * it.qty;
    const gstPct = it.gst;
    const taxable = inclusive ? Math.round((gross * 100) / (100 + gstPct)) : gross;
    const gst = inclusive ? gross - taxable : Math.round((gross * gstPct) / 100);
    return { name: it.name.trim(), qty: it.qty, unit, rate: gstPct, taxable, gst, total: taxable + gst };
  });
  const map = new Map<number, { rate: number; taxable: number; gst: number; cgst: number; sgst: number }>();
  for (const l of lines) {
    const s = map.get(l.rate) ?? { rate: l.rate, taxable: 0, gst: 0, cgst: 0, sgst: 0 };
    s.taxable += l.taxable;
    s.gst += l.gst;
    map.set(l.rate, s);
  }
  const slabs = [...map.values()].sort((a, b) => a.rate - b.rate);
  for (const s of slabs) {
    s.cgst = Math.floor(s.gst / 2);
    s.sgst = s.gst - s.cgst;
  }
  const taxable = lines.reduce((n, l) => n + l.taxable, 0);
  const gst = lines.reduce((n, l) => n + l.gst, 0);
  return { lines, taxable, gst, total: taxable + gst, slabs };
}

export const money = (paise: number) => `Rs.${(paise / 100).toFixed(2)}`;
