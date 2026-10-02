export default function PrivacyBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-volt text-black border-2 border-black rounded-lg shadow-[2px_2px_0_#000] px-3 py-1.5 label-mono text-[11px]">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="square" strokeWidth={3} d="M5 12l5 5 9-10" />
      </svg>
      Processed entirely on your device. File never uploaded.
    </div>
  );
}
