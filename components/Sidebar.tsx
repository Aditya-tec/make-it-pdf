const STRIPS = ["Drop", "Process", "Download"];

// Decorative blueprint tabs, large screens only. The layout reserves 200px for it (lg:pr-[200px]).
export default function Sidebar() {
  return (
    <aside aria-hidden className="hidden lg:flex fixed top-0 right-0 bottom-0 w-[200px] z-30 border-l-4 border-black">
      {STRIPS.map((s, i) => (
        <div
          key={s}
          className={`flex-1 flex items-center justify-center pt-16 border-black ${i ? "border-l-4" : ""} ${
            i === 1 ? "bg-volt" : "bg-white"
          }`}
        >
          <span className="vertical-text label-mono text-sm text-black">
            0{i + 1} / {s}
          </span>
        </div>
      ))}
    </aside>
  );
}
