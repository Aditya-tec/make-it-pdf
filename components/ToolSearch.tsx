"use client";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TOOLS } from "@/lib/tools";

interface Props {
  variant?: "compact" | "hero";
}

export default function ToolSearch({ variant = "compact" }: Props) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return TOOLS.filter((t) => {
      const hay = `${t.name} ${t.tagline} ${t.slug} ${t.category}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    }).slice(0, 8);
  }, [q]);

  const go = (slug: string) => {
    setOpen(false);
    setQ("");
    router.push(`/${slug}/`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pick = results[active] ?? results[0];
    if (pick) go(pick.slug);
    else setOpen(true);
  };

  const showList = open && q.trim().length > 0;
  const hero = variant === "hero";

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={`relative ${hero ? "w-full max-w-2xl" : "w-full max-w-[240px] min-w-0"}`}
    >
      <div
        className={
          hero
            ? "flex bg-white border-4 border-black shadow-[8px_8px_0_#fff]"
            : "flex bg-white border-4 border-black rounded-lg"
        }
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search tools
        </label>
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${listId}-${results[active].slug}` : undefined}
          autoComplete="off"
          value={q}
          placeholder={hero ? "MERGE, OCR, REDACT..." : "SEARCH"}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={`flex-1 min-w-0 bg-white text-black outline-none placeholder:text-slate-500 placeholder:font-[family-name:var(--font-mono)] placeholder:tracking-wider ${
            hero ? "px-4 py-4 text-base sm:text-lg" : "px-2.5 py-1.5 text-sm"
          }`}
        />
        {hero ? (
          <button
            type="submit"
            className="headline text-2xl sm:text-3xl px-5 sm:px-8 bg-black text-white border-l-4 border-black hover:bg-white hover:text-black transition-colors"
          >
            Find
          </button>
        ) : (
          <button type="submit" aria-label="Search" className="px-2 text-black">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="square" />
            </svg>
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-50 mt-2 bg-white text-black border-4 border-black shadow-[8px_8px_0_#000] max-h-80 overflow-auto ${
            hero ? "left-0 right-0" : "right-0 w-[min(88vw,320px)]"
          }`}
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 label-mono text-xs text-slate-500">No tool matches &ldquo;{q.trim()}&rdquo;</li>
          ) : (
            results.map((t, i) => (
              <li
                key={t.slug}
                id={`${listId}-${t.slug}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(t.slug);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b-4 border-black last:border-b-0 ${
                  i === active ? "bg-volt" : ""
                }`}
              >
                <span className="text-xl" aria-hidden>{t.icon}</span>
                <span className="min-w-0">
                  <span className="block label-mono text-xs">{t.name}</span>
                  <span className="block text-xs text-slate-600 truncate">{t.tagline}</span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </form>
  );
}
