"use client";

import type { HotspotConfig, ObjectId } from "@/types/game";

interface PlaceholderChapterSceneProps<TId extends ObjectId> {
  title: string;
  subtitle: string;
  hotspots: HotspotConfig<TId>[];
  completedIds: ObjectId[];
  backgroundImage?: string;
  chapterCleared?: boolean;
  clearTitle?: string;
  clearLines?: string[];
  clearImage?: string;
  continueLabel?: string;
  onContinue?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tertiaryLabel?: string;
  onTertiary?: () => void;
  onInspect: (objectId: TId) => void;
}

export function PlaceholderChapterScene<TId extends ObjectId>({
  title,
  subtitle,
  hotspots,
  completedIds,
  backgroundImage,
  chapterCleared = false,
  clearTitle,
  clearLines = [],
  clearImage,
  continueLabel,
  onContinue,
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
  onInspect,
}: PlaceholderChapterSceneProps<TId>) {
  return (
    <section className="glass-panel soft-glow relative h-full min-h-[420px] overflow-hidden bg-black fade-in" data-testid="placeholder-chapter-scene">
      <div className="relative h-full min-h-[420px] overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(15,118,160,0.22),rgba(2,6,14,0.92)_48%,#000_100%)]">
        {backgroundImage ? (
          <img src={backgroundImage} alt={title} className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent_0,rgba(0,0,0,0.14)_42%,rgba(0,0,0,0.68)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(103,232,249,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70" />
        {!backgroundImage ? (
          <>
            <div className="absolute left-[12%] top-[18%] h-[62%] w-[76%] border border-cyanline/20 bg-slate-950/40 shadow-[inset_0_0_80px_rgba(34,211,238,0.05)]" />
            <div className="absolute left-[41%] top-[20%] h-[42%] w-[18%] rounded-full border border-cyanline/25 bg-cyanline/10 blur-[0.2px]" />
          </>
        ) : null}
        <div className="absolute left-8 top-8 border border-cyanline/25 bg-black/35 px-4 py-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300/80">{title}</p>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        </div>

        <div className="absolute bottom-5 right-5 z-10 w-[min(380px,calc(100%-40px))] border border-cyanline/25 bg-slate-950/82 p-4 backdrop-blur-md" data-testid="investigation-targets">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300/75">Investigation Targets</p>
          <div className="mt-3 grid gap-2">
            {hotspots.map((hotspot) => {
              const completed = completedIds.includes(hotspot.id);
              return (
                <button
                  key={hotspot.id}
                  className={`flex items-center justify-between border px-3 py-2 text-left text-sm font-bold transition hover:border-cyanline hover:bg-cyanline/15 ${
                    completed
                      ? "border-slate-600/50 bg-slate-950/60 text-slate-400"
                      : "border-cyanline/35 bg-cyanline/10 text-cyan-50"
                  }`}
                  data-testid={`investigation-target-${hotspot.id}`}
                  onClick={() => onInspect(hotspot.id)}
                  type="button"
                >
                  <span>{hotspot.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {completed ? "checked" : hotspot.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {chapterCleared ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/76 px-4 backdrop-blur-sm" data-testid="chapter-clear-overlay">
          <div
            className={`glass-panel soft-glow w-full p-7 text-left fade-in ${clearImage ? "max-w-5xl" : "max-w-md"}`}
            data-testid={clearImage ? "ending-screen" : undefined}
          >
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Route Updated</p>
            <h2 className="mt-3 text-4xl font-black text-white" data-testid={clearImage ? "ending-title" : "chapter-clear-title"}>{clearTitle}</h2>
            {clearImage ? (
              <div className="mt-5 overflow-hidden border border-cyanline/20 bg-black/50">
                <img src={clearImage} alt={clearTitle} className="max-h-[48vh] w-full object-cover" data-testid="ending-image" />
              </div>
            ) : null}
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
              {clearLines.map((line, index) => (
                <p
                  key={`${index}-${line}`}
                  className="whitespace-pre-line"
                  data-testid={
                    clearImage
                      ? index === 0
                        ? "ending-body"
                        : index === 1
                          ? "ending-quote"
                          : index === 2
                            ? "ending-memory-summary"
                            : undefined
                      : undefined
                  }
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              {continueLabel && onContinue ? (
                <button
                  className="border border-cyanline/60 bg-cyanline/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
                  onClick={onContinue}
                  data-testid={clearImage ? "ending-restart-button" : undefined}
                  type="button"
                >
                  {continueLabel}
                </button>
              ) : null}
              {secondaryLabel && onSecondary ? (
                <button
                  className="border border-slate-500/70 bg-slate-950/70 px-5 py-2 text-sm font-bold text-slate-200 transition hover:border-cyanline hover:text-cyan-100"
                  onClick={onSecondary}
                  data-testid={clearImage ? "ending-reset-save-button" : undefined}
                  type="button"
                >
                  {secondaryLabel}
                </button>
              ) : null}
              {tertiaryLabel && onTertiary ? (
                <button
                  className="border border-slate-500/70 bg-slate-950/70 px-5 py-2 text-sm font-bold text-slate-200 transition hover:border-cyanline hover:text-cyan-100"
                  onClick={onTertiary}
                  type="button"
                >
                  {tertiaryLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
