export const NEEDS_NEWER_BROWSER =
  "This tool needs a newer browser. Try updating your browser, or use Chrome or Firefox.";

export default function Unsupported({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-200"
    >
      {children}
    </div>
  );
}
