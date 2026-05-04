import type { GameLog } from "@/types/game";

interface LogPanelProps {
  logs: GameLog[];
  onHint: () => void;
  onAnalysis: () => void;
  onEcho: (choice: string) => void;
}

const toneStyle: Record<GameLog["tone"], string> = {
  system: "border-slate-700/50 bg-slate-950/55 text-slate-300",
  serin: "border-cyanline/25 bg-cyan-950/20 text-cyan-100",
  node: "border-slate-500/40 bg-slate-950/75 text-slate-300",
  echo: "border-cyanline/35 bg-cyan-950/15 text-cyan-50 shadow-[0_0_22px_rgba(45,212,191,0.08)]",
  player: "border-sky-300/25 bg-sky-950/15 text-sky-100",
};

const labelStyle: Record<GameLog["tone"], string> = {
  system: "SYS",
  serin: "SE-RIN",
  node: "NODE",
  echo: "ECHO",
  player: "IAN",
};

const echoActions = [
  {
    id: "listen",
    label: "신호 수신 시작",
    description: "미확인 통신을 받아들입니다.",
  },
  {
    id: "reject",
    label: "연결 거부",
    description: "현재 ECHO 신호를 차단합니다.",
  },
  {
    id: "ask_identity",
    label: "송신자 확인",
    description: "신호 출처 식별 로그를 조회합니다.",
  },
];

export function LogPanel({ logs, onHint, onAnalysis, onEcho }: LogPanelProps) {
  return (
    <aside className="glass-panel flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-cyanline/15 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Facility Feed</p>
        <h2 className="mt-1 text-lg font-black text-white">시스템 로그</h2>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {logs.slice(-11).map((log, index) => (
          <article key={log.id} className={`log-enter border px-3 py-3 ${toneStyle[log.tone]}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                {labelStyle[log.tone]} / {log.speaker}
              </p>
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                L-{String(index + 1).padStart(3, "0")}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-6">{log.message}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-3 border-t border-cyanline/15 p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="border border-cyanline/35 bg-cyanline/10 px-3 py-3 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/20"
            onClick={onHint}
            type="button"
          >
            힌트 요청
          </button>
          <button
            className="border border-sky-300/30 bg-sky-400/10 px-3 py-3 text-sm font-bold text-sky-100 transition hover:border-sky-300 hover:bg-sky-400/15"
            onClick={onAnalysis}
            type="button"
          >
            단서 분석
          </button>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">ECHO Signal</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">미확인 ECHO 신호에 대한 짧은 응답입니다.</p>
          <div className="mt-2 grid gap-2">
            {echoActions.map((action) => (
              <button
                key={action.id}
                className="border border-cyanline/25 bg-slate-950/60 px-3 py-2 text-left transition hover:border-cyanline/60 hover:bg-cyanline/10"
                onClick={() => onEcho(action.id)}
                type="button"
              >
                <span className="block text-xs font-black text-cyan-100">{action.label}</span>
                <span className="mt-1 block text-[11px] leading-4 text-slate-400">{action.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
