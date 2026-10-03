"use client";
import { useState, useSyncExternalStore } from "react";
import ProgressBar from "@/components/ProgressBar";
import DownloadResult from "@/components/download/DownloadResult";
import { useWorker } from "@/hooks/useWorker";
import { calc, money, type PosItem } from "@/lib/pos";

type Product = { name: string; price: number; gst: number };
const KEY = "offlinepdf.pos.products";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const read = () => localStorage.getItem(KEY) ?? "[]";

export default function PosTool() {
  // localStorage is the single source of truth; the server snapshot is an empty list.
  const raw = useSyncExternalStore(subscribe, read, () => "[]");
  const products: Product[] = (() => {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  })();
  const save = (next: Product[]) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  };

  const [cart, setCart] = useState<Record<number, number>>({});
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("18");
  const [shop, setShop] = useState("My Shop");
  const [width, setWidth] = useState("80mm");
  const [inclusive, setInclusive] = useState(false);
  const [interState, setInterState] = useState(false);
  const [error, setError] = useState("");
  const { job, run, reset } = useWorker();

  const items: PosItem[] = Object.entries(cart)
    .filter(([i, q]) => q > 0 && products[Number(i)])
    .map(([i, qty]) => ({ ...products[Number(i)], qty }));
  let totals = null;
  try {
    totals = items.length ? calc(items, inclusive) : null;
  } catch {
    totals = null;
  }

  const addProduct = () => {
    const p = Number(price);
    const g = Number(gst);
    if (!name.trim() || name.length > 60 || !Number.isFinite(p) || p < 0 || p > 1e7 || !Number.isFinite(g) || g < 0 || g > 100) {
      setError("Enter a name (up to 60 characters), a price, and a GST % from 0 to 100.");
      return;
    }
    setError("");
    save([...products, { name: name.trim(), price: p, gst: g }].slice(0, 500));
    setName("");
    setPrice("");
  };

  const makeReceipt = () => {
    setError("");
    run({ tool: "pos-billing", files: [new ArrayBuffer(1)], options: { shop, width, inclusive, interState, items } });
  };

  const handleReset = () => reset();
  if (job.status === "processing") return <ProgressBar percent={job.percent} message={job.message} />;
  if (job.status === "done") return <DownloadResult files={job.files} onReset={handleReset} />;
  if (job.status === "error") return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p role="alert" className="text-red-600 text-center">{job.message}</p>
      <button onClick={handleReset} className="text-sm underline text-slate-500">Back to cart</button>
    </div>
  );

  const field = "border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white";
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-slate-500">
        <strong>A receipt tool, not an invoice generator.</strong> GST is simplified: one rate per line, split into CGST/SGST (or IGST), no HSN codes, GSTIN checks, or cess.
        The product list stays in this browser&apos;s local storage.
      </p>

      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-xs text-slate-600">Product<input aria-label="Product name" value={name} onChange={(e) => setName(e.target.value)} className={`${field} block w-40`} /></label>
        <label className="text-xs text-slate-600">Price<input aria-label="Price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={`${field} block w-24`} /></label>
        <label className="text-xs text-slate-600">GST %<input aria-label="GST percent" inputMode="decimal" value={gst} onChange={(e) => setGst(e.target.value)} className={`${field} block w-20`} /></label>
        <button onClick={addProduct} className="border-2 border-black rounded-lg px-3 py-2 text-sm font-semibold bg-volt">Add product</button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {products.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-2">
          {products.map((p, i) => (
            <li key={i} className="flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white text-sm">
              <button aria-label={`Add ${p.name} to cart`} onClick={() => setCart({ ...cart, [i]: Math.min(9999, (cart[i] ?? 0) + 1) })} className="flex-1 text-left">
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs text-slate-500">{money(Math.round(p.price * 100))} · GST {p.gst}%</span>
              </button>
              <span className="text-xs text-slate-500">in cart: {cart[i] ?? 0}</span>
              {(cart[i] ?? 0) > 0 && <button aria-label={`Remove one ${p.name}`} onClick={() => setCart({ ...cart, [i]: cart[i] - 1 })} className="px-2 border rounded">−</button>}
              <button aria-label={`Delete ${p.name}`} onClick={() => { save(products.filter((_, j) => j !== i)); setCart({}); }} className="px-2 text-red-600">✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-xs text-slate-600">Shop name<input aria-label="Shop name" value={shop} maxLength={60} onChange={(e) => setShop(e.target.value)} className={`${field} block w-44`} /></label>
        <label className="text-xs text-slate-600">Width
          <select aria-label="Receipt width" value={width} onChange={(e) => setWidth(e.target.value)} className={`${field} block`}>
            <option value="80mm">Thermal 80 mm</option>
            <option value="58mm">Thermal 58 mm</option>
            <option value="a4">A4</option>
          </select>
        </label>
        <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={inclusive} onChange={(e) => setInclusive(e.target.checked)} />Prices include GST</label>
        <label className="text-sm flex gap-2 items-center"><input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} />Inter-state (IGST)</label>
      </div>

      {totals && (
        <div className="border-2 border-black rounded-xl p-3 bg-white text-sm" data-testid="pos-total">
          {totals.lines.map((l, i) => <div key={i} className="flex justify-between"><span>{l.name} × {l.qty}</span><span>{money(l.total)}</span></div>)}
          <div className="flex justify-between border-t mt-2 pt-1"><span>GST</span><span>{money(totals.gst)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>{money(totals.total)}</span></div>
        </div>
      )}
      <div className="flex gap-3 items-center">
        <button onClick={makeReceipt} disabled={!items.length} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl">
          Make receipt
        </button>
        {items.length > 0 && <button onClick={() => setCart({})} className="text-sm underline text-slate-500">Clear cart</button>}
      </div>
    </div>
  );
}
