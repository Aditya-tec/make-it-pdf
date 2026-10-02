"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TOOLS, type Tool } from "@/lib/tools";

/** Extra phrases so voice/text like "make it smaller" still hits the right tool. */
const ALIASES: Record<string, string[]> = {
  "merge-pdf": ["combine", "join", "stitch"],
  "split-pdf": ["extract pages", "separate", "divide"],
  "compress-pdf": ["shrink", "smaller", "reduce size", "compress", "make smaller"],
  "pdf-to-jpg": ["to image", "to jpg", "to jpeg", "export images", "screenshot"],
  "images-to-pdf": ["photos to pdf", "jpg to pdf", "png to pdf"],
  "word-to-pdf": ["docx", "document to pdf", "word"],
  "organize-pages": ["reorder", "rearrange", "delete pages"],
  "add-watermark": ["stamp", "branding", "watermark"],
  "encrypt-pdf": ["password", "protect", "lock", "secure", "encrypt"],
  "extract-text": ["copy text", "get text", "plain text"],
  "rotate-pdf": ["turn", "rotate", "upside down"],
  "crop-resize": ["crop", "resize", "margins", "a4"],
  "page-numbers": ["number pages", "pagination"],
  "headers-footers": ["header", "footer"],
  "remove-password": ["unlock", "decrypt", "remove password"],
  "ocr-pdf": ["ocr", "scan", "searchable", "recognize text", "scanned"],
  "flatten-pdf": ["flatten", "bake forms"],
  "redact-pdf": ["black out", "censor", "redact", "hide text"],
  "invert-colors": ["dark mode", "grayscale", "sepia", "invert"],
  "privacy-scanner": ["metadata", "strip info", "privacy", "exif"],
};

function scoreTool(tool: Tool, words: string[]): number {
  if (!words.length) return 0;
  const alias = (ALIASES[tool.slug] || []).join(" ");
  const hay = `${tool.name} ${tool.tagline} ${tool.description} ${tool.slug} ${tool.category} ${alias}`.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (!w) continue;
    if (tool.name.toLowerCase().includes(w)) score += 5;
    else if (tool.slug.includes(w)) score += 4;
    else if (alias.includes(w)) score += 4;
    else if (hay.includes(w)) score += 2;
    else return 0; // every word must match somewhere
  }
  return score;
}

function rankTools(q: string): Tool[] {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return TOOLS.map((t) => ({ t, s: scoreTool(t, words) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.t.name.localeCompare(b.t.name))
    .slice(0, 8)
    .map((x) => x.t);
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function ToolSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  const results = useMemo(() => rankTools(q), [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const go = (slug: string) => {
    setOpen(false);
    setQ("");
    setVoiceHint(null);
    router.push(`/${slug}/`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[active] || results[0];
      if (pick) go(pick.slug);
    }
  };

  const toggleVoice = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceHint("Voice input needs Chrome, Edge, or Safari.");
      return;
    }
    if (listening && recRef.current) {
      recRef.current.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript?.trim() || "";
      if (!said) return;
      setQ(said);
      setOpen(true);
      setVoiceHint(`Heard: “${said}”`);
      inputRef.current?.focus();
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceHint("Couldn't hear that — try again or type instead.");
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
      setVoiceHint("Listening… say what you need (e.g. “compress my PDF”).");
    } catch {
      setListening(false);
      setVoiceHint("Mic busy — close other tabs using the microphone.");
    }
  };

  return (
    <div className="relative flex-1 min-w-0 max-w-xl mx-auto">
      <div className="flex items-stretch border-2 border-black rounded-xl overflow-hidden shadow-[3px_3px_0_#000] bg-white">
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setVoiceHint(null);
          }}
          onFocus={() => q.trim() && setOpen(true)}
          onBlur={() => {
            // delay so click on a result still registers
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={onKeyDown}
          placeholder="Find a tool… merge, OCR, redact…"
          className="flex-1 min-w-0 px-3 py-2 text-sm outline-none bg-white selection:bg-blue-500 selection:text-white"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={toggleVoice}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice input" : "Search by voice"}
          title="Voice search"
          className={`shrink-0 w-11 flex items-center justify-center border-l-2 border-black transition-colors ${
            listening ? "bg-red-500 text-white" : "bg-volt text-black hover:bg-black hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a1 1 0 01-1-1v-2.07a7.002 7.002 0 01-5.9-4.42l1.9-.6A5 5 0 0017 13.93V19a1 1 0 01-1 1h-4z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            const pick = results[active] || results[0];
            if (pick) go(pick.slug);
            else setOpen(true);
          }}
          className="shrink-0 label-mono text-[11px] px-3 bg-black text-white border-l-2 border-black hover:bg-white hover:text-black transition-colors"
        >
          Find
        </button>
      </div>

      {voiceHint && (
        <p className="absolute left-0 right-0 top-full mt-1 label-mono text-[10px] text-slate-600 bg-white border-2 border-black px-2 py-1 z-50">
          {voiceHint}
        </p>
      )}

      {open && q.trim() && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0_#000] max-h-72 overflow-auto"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-slate-500">No tools match — try “compress”, “password”, “OCR”…</li>
          ) : (
            results.map((t, i) => (
              <li key={t.slug} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-volt ${
                    i === active ? "bg-volt" : ""
                  } ${i ? "border-t border-black/20" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(t.slug)}
                >
                  <span className="text-xl shrink-0" aria-hidden>
                    {t.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block label-mono text-xs">{t.name}</span>
                    <span className="block text-xs text-slate-600 truncate">{t.tagline}</span>
                  </span>
                  {i === 0 && (
                    <span className="ml-auto shrink-0 label-mono text-[10px] bg-black text-white px-1.5 py-0.5">
                      Best
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
