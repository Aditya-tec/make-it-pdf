"use client";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-40">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-lg text-indigo-600 dark:text-indigo-400 tracking-tight"
        >
          PDF Tools
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Tools
          </Link>
          <Link href="/blog" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            How-to Guides
          </Link>
        </div>

        {/* mobile hamburger */}
        <button
          className="md:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <rect y="3" width="20" height="2" rx="1" />
            <rect y="9" width="20" height="2" rx="1" />
            <rect y="15" width="20" height="2" rx="1" />
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            Tools
          </Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)}>
            How-to Guides
          </Link>
        </div>
      )}
    </header>
  );
}
