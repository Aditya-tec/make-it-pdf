import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 mt-16 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
      <p>
        All files processed entirely in your browser — nothing is ever uploaded to a server.
      </p>
      <p className="mt-2">
        <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          PDF Tools
        </Link>{" "}
        · Free forever · No watermark · No signup ·{" "}
        <Link
          href="/blog"
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          How-to Guides
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Terms
        </Link>
      </p>
    </footer>
  );
}
