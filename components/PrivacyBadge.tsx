export default function PrivacyBadge() {
  return (
    <div className="inline-flex items-center gap-2 -rotate-1 bg-volt text-black border-4 border-black shadow-[4px_4px_0_#000] px-3 py-1.5 label-mono text-[11px]">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="square" strokeWidth={3} d="M5 12l5 5 9-10" />
      </svg>
      Processed entirely on your device. File never uploaded.
    </div>
  );
}
