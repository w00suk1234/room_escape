interface HudBarProps {
  title: string;
  goal: string;
  suspicion: number;
  hintLevel: number;
  pulse: boolean;
}

export function HudBar({ title, goal, suspicion, pulse }: HudBarProps) {
  const exposure = Math.min(100, suspicion);

  return (
    <header
      className={`glass-panel relative z-10 grid gap-4 px-5 py-4 md:grid-cols-[1fr_280px] md:items-center ${
        pulse ? "pulse-danger" : ""
      }`}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">{title}</p>
        <h1 className="mt-1 text-lg font-bold text-white md:text-xl">{goal}</h1>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
          <span>System Exposure</span>
          <span className="text-cyan-100">{exposure}%</span>
        </div>
        <div className="h-2 overflow-hidden border border-slate-700 bg-slate-950">
          <div
            className="h-full bg-gradient-to-r from-cyanline to-rose-400 transition-all duration-500"
            style={{ width: `${exposure}%` }}
          />
        </div>
      </div>
    </header>
  );
}
