"use client";
import Link from "next/link";
import { useState } from "react";
import ToolSearch from "@/components/ToolSearch";
import { TOOLS } from "@/lib/tools";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white text-black border-b-4 border-black">
      <nav className="px-3 sm:px-6 h-16 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="PDF Tools home">
          <span className="w-9 h-9 sm:w-10 sm:h-10 bg-black rotate-3 flex items-center justify-center" aria-hidden>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 2h9l5 5v15H6z" strokeLinejoin="miter" />
              <path d="M15 2v5h5M9 13h6M9 17h6" />
            </svg>
          </span>
          <span className="font-extrabold text-lg sm:text-2xl lg:text-[30px] tracking-tight leading-none">PDF TOOLS</span>
        </Link>

        <div className="flex-1 flex justify-end min-w-0">
          <ToolSearch />
        </div>

        <span className="hidden xl:inline-block label-mono text-[11px] bg-volt border-4 border-black px-2 py-1 shadow-[4px_4px_0_#000] shrink-0">
          {TOOLS.length} tools / 0 uploads
        </span>
        <Link href="/blog" className="hidden md:inline-flex btn shrink-0">
          Guides
        </Link>

        <button
          className="md:hidden p-1.5 border-4 border-black rounded-lg shrink-0"
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
        <div className="md:hidden border-t-4 border-black bg-white px-4 py-3 flex flex-col gap-3 label-mono text-sm">
          <Link href="/" onClick={() => setMenuOpen(false)}>All tools</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}>How-to guides</Link>
          <Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link>
        </div>
      )}
    </header>
  );
}
