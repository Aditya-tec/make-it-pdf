export const NEEDS_NEWER_BROWSER =
  "This tool needs a newer browser. Try updating your browser, or use Chrome or Firefox.";

export default function Unsupported({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="bg-volt text-black border-2 border-black rounded-xl shadow-[2px_2px_0_#000] p-4 text-sm font-medium"
    >
      {children}
    </div>
  );
}
