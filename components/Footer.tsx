import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="bg-white text-black border-t-8 border-black">
      <div className="px-3 sm:px-8 py-8 sm:py-10 flex flex-col md:flex-row gap-5 sm:gap-6 md:items-center md:justify-between">
        <p className="headline text-2xl sm:text-4xl">{SITE_NAME}</p>
        <p className="label-mono text-xs max-w-sm leading-relaxed">
          Processes files entirely in your browser; tested with zero third-party network requests during
          file processing. No account required, no feature behind a paywall, no watermark.
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 label-mono text-xs">
          <Link href="/" className="underline decoration-4 underline-offset-4 hover:bg-volt">Tools</Link>
          <Link href="/blog" className="underline decoration-4 underline-offset-4 hover:bg-volt">Guides</Link>
          <Link href="/changelog" className="underline decoration-4 underline-offset-4 hover:bg-volt">Changelog</Link>
          <Link href="/privacy" className="underline decoration-4 underline-offset-4 hover:bg-volt">Privacy</Link>
          <Link href="/terms" className="underline decoration-4 underline-offset-4 hover:bg-volt">Terms</Link>
          <a
            href="https://www.adityakalambe.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-volt px-1.5 py-0.5 border-2 border-black shadow-[2px_2px_0_#000] hover:bg-black hover:text-volt"
          >
            Built by Aditya
          </a>
        </nav>
      </div>
    </footer>
  );
}
