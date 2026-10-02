"use client";

import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";

// ponytail: interval typewriter; swap for a motion lib if we need erase/caret polish
const CHAR_MS = 70;
const CYCLE_MS = 5000;

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
    <span className="relative inline-block">
      <span className="invisible" aria-hidden>
        {SITE_NAME}
      </span>
      <span className="absolute inset-0" aria-label={SITE_NAME}>
        {SITE_NAME.slice(0, len)}
        <span className="inline-block w-[0.08em] h-[0.85em] ml-[0.05em] align-baseline bg-volt animate-pulse" aria-hidden />
      </span>
    </span>
  );
}
