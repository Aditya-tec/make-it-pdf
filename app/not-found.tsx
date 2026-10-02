import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 sm:px-8 py-24">
      <h1 className="headline text-7xl sm:text-9xl text-white [text-shadow:6px_6px_0_#000] mb-6">
        Page <span className="text-volt">not</span> found
      </h1>
      <p className="text-xl italic text-slate-300 mb-10">That page doesn&apos;t exist.</p>
      <Link href="/" className="btn">
        Back to all PDF tools
      </Link>
    </div>
  );
}
