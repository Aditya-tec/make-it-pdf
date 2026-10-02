import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-3">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">That page doesn&apos;t exist.</p>
      <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline">
        Back to all PDF tools
      </Link>
    </div>
  );
}
