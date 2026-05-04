"use client";

import { useState } from "react";
import type { AudioSettings } from "@/data/audio";
import type { GameLog } from "@/types/game";

interface AudioControlsProps {
  settings: AudioSettings;
  logs: GameLog[];
  hintLevel: number;
  onToggleMuted: () => void;
  onMasterVolume: (value: number) => void;
  onBgmVolume: (value: number) => void;
  onSfxVolume: (value: number) => void;
  onHint: () => void;
  onAnalysis: () => void;
  onReturnToStart?: () => void;
  onClearSave?: () => void;
}

const labelStyle: Record<GameLog["tone"], string> = {
  system: "SYS",
  serin: "SE-RIN",
  node: "NODE",
  echo: "ECHO",
  player: "IAN",
};

function percent(value: number) {
  return Math.round(value * 100);
}

export function AudioControls({
  settings,
  logs,
  hintLevel,
  onToggleMuted,
  onMasterVolume,
  onBgmVolume,
  onSfxVolume,
  onHint,
  onAnalysis,
  onReturnToStart,
  onClearSave,
}: AudioControlsProps) {
  const [open, setOpen] = useState(false);

  function slider(label: string, value: number, onChange: (value: number) => void) {
    return (
      <label className="grid gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        <span className="flex justify-between">
          <span>{label}</span>
          <span className="text-cyan-100">{percent(value)}%</span>
        </span>
        <input
          className="accent-cyan-300"
          max={100}
          min={0}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          type="range"
          value={percent(value)}
        />
      </label>
    );
  }

  return (
    <div className="fixed right-5 top-24 z-[70] text-xs text-slate-100">
      <button
        className="flex items-center gap-2 border border-cyanline/50 bg-slate-950/90 px-4 py-3 font-black text-cyan-100 shadow-2xl backdrop-blur-md transition hover:border-cyanline hover:bg-cyanline/15"
        data-testid="settings-button"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden className="relative h-4 w-4 rounded-full border-2 border-cyan-200">
          <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200" />
        </span>
        설정
      </button>

      {open ? (
        <section
          className="mt-2 grid max-h-[78vh] w-[420px] gap-4 overflow-y-auto border border-cyanline/25 bg-slate-950/94 p-4 shadow-2xl backdrop-blur-md"
          data-testid="settings-panel"
        >
          <div className="flex items-start justify-between gap-3 border-b border-cyanline/15 pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Control Menu</p>
              <h2 className="mt-1 text-xl font-black text-white">설정</h2>
            </div>
            <button
              className={`border px-3 py-2 font-black transition ${
                settings.muted
                  ? "border-rose-300/40 bg-rose-950/30 text-rose-100"
                  : "border-cyanline/40 bg-cyanline/10 text-cyan-100"
              }`}
              onClick={onToggleMuted}
              type="button"
            >
              {settings.muted ? "SOUND OFF" : "SOUND ON"}
            </button>
          </div>

          <div className="grid gap-3">
            {slider("Master", settings.masterVolume, onMasterVolume)}
            {slider("BGM", settings.bgmVolume, onBgmVolume)}
            {slider("SFX", settings.sfxVolume, onSfxVolume)}
          </div>

          <div className="grid gap-2 border-t border-cyanline/15 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Hint</p>
              <p className="font-black text-cyan-100">{hintLevel}/3</p>
            </div>
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
          </div>

          <div className="border-t border-cyanline/15 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Facility Log</p>
              <span className="text-[10px] text-slate-500">{logs.length} records</span>
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {logs.slice(-12).map((log, index) => (
                <article key={log.id} className="border border-slate-700/50 bg-slate-950/60 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/80">
                      {labelStyle[log.tone]} / {log.speaker}
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      L-{String(index + 1).padStart(3, "0")}
                    </span>
                  </div>
                  <p className="whitespace-pre-line text-xs leading-5 text-slate-300">{log.message}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-cyanline/15 pt-3">
            {onReturnToStart ? (
              <button
                className="border border-slate-600/70 bg-slate-950/60 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyanline hover:text-cyan-100"
                onClick={onReturnToStart}
                type="button"
              >
                처음으로
              </button>
            ) : null}
            {onClearSave ? (
              <button
                className="border border-rose-300/25 bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-100 transition hover:border-rose-300/50"
                onClick={onClearSave}
                type="button"
              >
                저장 삭제
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
