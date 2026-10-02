interface Props {
  percent: number;
  message?: string;
}

export default function ProgressBar({ percent, message }: Props) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3 py-8">
      <div className="flex justify-between gap-4 label-mono text-xs text-black">
        <span>{message || "Processing…"}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-white border-4 border-black h-7 shadow-[4px_4px_0_#000]">
        <div
          className="bg-volt h-full border-r-4 border-black transition-all duration-300"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
