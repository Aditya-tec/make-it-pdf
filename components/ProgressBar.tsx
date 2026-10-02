interface Props {
  percent: number;
  message?: string;
}

export default function ProgressBar({ percent, message }: Props) {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-2 py-8">
      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>{message || "Processing…"}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
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
