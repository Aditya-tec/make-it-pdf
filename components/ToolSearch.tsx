"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isConfident, rankTools } from "@/lib/toolSearch";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
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

function voiceErrorHint(code: string): string | null {
  // aborted = user stopped / we replaced the session — not a failure
  if (code === "aborted") return null;
  if (code === "no-speech") return "Didn't catch that — speak a bit louder, then try again.";
  if (code === "audio-capture") return "No mic found — plug one in or check OS sound settings.";
  if (code === "not-allowed" || code === "service-not-allowed") {
    return "Mic blocked — click the lock icon in the address bar and allow microphone.";
  }
  if (code === "network") {
    return "Voice needs a short network hop (browser speech). Check connection, or just type.";
  }
  return "Couldn't hear that — try again or type instead.";
}

export default function ToolSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQRaw] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [listening, setListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  const setQ = (v: string) => {
    setQRaw(v);
    setActive(0);
    setTouched(false);
  };

  const matches = useMemo(() => rankTools(q), [q]);
  const results = useMemo(() => matches.map((m) => m.tool), [matches]);
  const [touched, setTouched] = useState(false); // user arrowed/hovered a row

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

  /** Enter / Find: jump if the intent is clear, otherwise keep the list open to choose. */
  const submit = () => {
    if (!q.trim()) return;
    if (touched && results[active]) return go(results[active].slug);
    if (results.length && isConfident(matches)) return go(results[0].slug);
    setOpen(true);
    setVoiceHint(results.length ? "Not sure which you mean, pick one below." : null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setTouched(true);
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTouched(true);
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const toggleVoice = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setVoiceHint("Voice input needs Chrome, Edge, or Safari.");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setVoiceHint("Voice needs HTTPS (or localhost).");
      return;
    }
    if (listening && recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        /* ignore */
      }
      setListening(false);
      setVoiceHint(null);
      return;
    }
    const rec = new Ctor();
    recRef.current = rec;
    rec.lang = navigator.language?.startsWith("en") ? navigator.language : "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      // Prefer the final chunk; fall back to the latest interim so UX feels live.
      let said = "";
      const list = ev.results;
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const text = row?.[0]?.transcript?.trim() || "";
        if (!text) continue;
        said = text;
        // SpeechRecognitionResult has isFinal on the real API; optional for our slim type
        if ((row as { isFinal?: boolean }).isFinal) break;
      }
      if (!said) return;
      setQ(said);
      setOpen(true);
      setVoiceHint(`Heard: “${said}”`);
      inputRef.current?.focus();
    };
    rec.onerror = (ev) => {
      setListening(false);
      setVoiceHint(voiceErrorHint(ev.error));
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
          placeholder="Describe it… “make my pdf smaller”"
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
          onClick={submit}
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
            <li className="px-3 py-3 text-sm text-slate-500">No match. Try words like “smaller”, “password”, “scan”, “merge”.</li>
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
