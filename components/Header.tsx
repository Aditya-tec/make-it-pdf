"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SITE_NAME } from "@/lib/site";
import { TOOLS } from "@/lib/tools";
import ToolSearch from "@/components/ToolSearch";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white text-black border-b-4 border-black">
      <nav className="px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-1.5 sm:gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label={`${SITE_NAME} home`}>
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-black rotate-3"
            priority
          />
          {/* Hide brand text under ~380px so search keeps usable width */}
          <span className="hidden min-[380px]:inline font-extrabold text-base sm:text-2xl lg:text-[30px] tracking-tight leading-none">
            {SITE_NAME}
          </span>
        </Link>

        <div className="flex-1 min-w-0 px-0.5 sm:px-1">
          <ToolSearch />
        </div>

        <span className="hidden xl:inline-block label-mono text-[11px] bg-volt border-4 border-black px-2 py-1 shadow-[4px_4px_0_#000] shrink-0">
          {TOOLS.length} tools / 0 uploads
        </span>
        <Link href="/blog" className="hidden md:inline-flex btn shrink-0">
          Guides
        </Link>

        <button
          className="md:hidden min-w-11 min-h-11 flex items-center justify-center border-2 sm:border-4 border-black rounded-lg shrink-0"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <rect y="3" width="20" height="3" />
            <rect y="9" width="20" height="3" />
            <rect y="15" width="20" height="3" />
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t-4 border-black bg-white px-4 py-4 flex flex-col gap-1 label-mono text-sm">
          <Link href="/" onClick={() => setMenuOpen(false)} className="py-3 border-b border-black/10">All tools</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} className="py-3 border-b border-black/10">How-to guides</Link>
          <Link href="/privacy" onClick={() => setMenuOpen(false)} className="py-3">Privacy</Link>
        </div>
      )}
    </header>
  );
}
