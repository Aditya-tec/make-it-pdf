"use client";

import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";

// ponytail: interval typewriter; swap for a motion lib if we need erase polish
const CHAR_MS = 70;
const CYCLE_MS = 3000;

export default function TypeSiteName() {
  const [len, setLen] = useState(SITE_NAME.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let charTimer: ReturnType<typeof setInterval> | undefined;

    const type = () => {
      let i = 0;
      setLen(0);
      clearInterval(charTimer);
      charTimer = setInterval(() => {
        i += 1;
        setLen(i);
        if (i >= SITE_NAME.length) clearInterval(charTimer);
      }, CHAR_MS);
    };

    type();
    const cycle = setInterval(type, CYCLE_MS);
    return () => {
      clearInterval(charTimer);
      clearInterval(cycle);
    };
  }, []);

  return (
    // nowrap keeps caret on this line; max-width + clip avoids horizontal scroll on tiny phones
    <span className="relative inline-block whitespace-nowrap align-baseline max-w-full">
      <span className="invisible" aria-hidden>
        {SITE_NAME}
        <span className="inline-block w-[0.1em]" />
      </span>
      <span
        className="absolute left-0 top-0 text-volt [text-shadow:0_0_10px_#ccff00,0_0_22px_#ccff00]"
        aria-label={SITE_NAME}
      >
        {SITE_NAME.slice(0, len)}
        <span
          className="inline-block w-[0.08em] h-[0.85em] ml-[0.06em] align-baseline animate-pulse bg-volt shadow-[0_0_12px_#ccff00]"
          aria-hidden
        />
      </span>
    </span>
  );
}
