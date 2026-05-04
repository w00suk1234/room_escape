"use client";

import { InteractiveImageScene } from "@/components/InteractiveImageScene";
import { CHAPTER4_GOAL, chapter4Hotspots, chapter4ImageMap } from "@/data/chapter4";
import type { Chapter4ObjectId, ObjectId } from "@/types/game";

function formatEndingQuote(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('"') || trimmed.startsWith("“")) return line;

  const separatorIndex = line.indexOf(":");
  if (separatorIndex >= 0) {
    const speaker = line.slice(0, separatorIndex).trim();
    const text = line.slice(separatorIndex + 1).trim();
    if (!text || text.startsWith('"') || text.startsWith("“")) return line;
    return `${speaker}: "${text}"`;
  }

  return `"${line}"`;
}

interface Chapter4SceneProps {
  inspectedObjects: ObjectId[];
  completedObjects?: string[];
  finalSentenceReady: boolean;
  finalChoiceReady: boolean;
  chapterCleared: boolean;
  clearTitle?: string;
  clearLines: string[];
  clearImage?: string;
  onInspect: (objectId: Chapter4ObjectId) => void;
  onRestart: () => void;
  onBranchPoint: () => void;
  onClearSave: () => void;
  onReplayEndingMusic?: () => void;
}

export function Chapter4Scene({
  inspectedObjects,
  completedObjects = [],
  finalSentenceReady,
  finalChoiceReady,
  chapterCleared,
  clearTitle = "Ending",
  clearLines,
  clearImage,
  onInspect,
  onRestart,
  onBranchPoint,
  onClearSave,
  onReplayEndingMusic,
}: Chapter4SceneProps) {
  const completedIds = [...new Set([...inspectedObjects, ...completedObjects])];
  const isHiddenEnding = clearTitle === "서하의 이름";
  const visibleHotspots = chapter4Hotspots.map((hotspot) => {
    if (hotspot.id === "finalSentencePuzzle") {
      return {
        ...hotspot,
        label: finalSentenceReady ? "마지막 문장 복원" : "마지막 문장 복원: 잠김",
      };
    }

    if (hotspot.id === "coreChoiceTerminal") {
      return {
        ...hotspot,
        label: finalChoiceReady ? "코어 선택 장치" : "코어 선택 장치: 잠김",
      };
    }

    return hotspot;
  });

  return (
    <section className="glass-panel soft-glow relative h-full min-h-[420px] overflow-hidden bg-black fade-in" data-testid="chapter4-scene">
      <InteractiveImageScene
        src={chapter4ImageMap.chapter4CoreRoom}
        alt="코어 룸"
        hotspots={visibleHotspots}
        completedIds={completedIds}
        onHotspotClick={onInspect}
        showLabels
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,transparent_0,rgba(3,5,10,0.08)_36%,rgba(0,0,0,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,20,35,0.05),transparent_44%,rgba(0,0,0,0.48)_100%)]" />
        <div className="pointer-events-none absolute left-[3%] top-[5%] max-w-[310px] border border-cyanline/10 bg-black/26 px-3 py-2 opacity-72 backdrop-blur-sm">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-300/55">CORE ROOM LOG</p>
          <p className="mt-1.5 text-xs font-semibold text-slate-200/85">코어가 마지막 반응을 기다린다</p>
          <p className="mt-1.5 text-[11px] italic text-slate-400/85">열리는 건 문이 아니라 선택이다.</p>
          <p className="mt-1.5 text-[11px] leading-5 text-slate-400/80">
            조사한 기억이 많을수록, 같은 선택도 다른 의미를 가진다.
          </p>
        </div>
      </InteractiveImageScene>

      {chapterCleared ? (
        <div className="fixed inset-0 z-[90] bg-black text-slate-100 fade-in" data-testid="chapter-clear-overlay">
          {clearImage ? (
            <img src={clearImage} alt="" aria-hidden className={`absolute inset-0 h-full w-full object-cover blur-[1px] ${isHiddenEnding ? "opacity-[0.34] saturate-125 brightness-110" : "opacity-20"}`} />
          ) : null}
          <div className={isHiddenEnding ? "absolute inset-0 bg-[radial-gradient(circle_at_30%_45%,rgba(250,204,21,0.18),transparent_30%),radial-gradient(circle_at_68%_58%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.12),rgba(5,8,18,0.84)_52%,rgba(0,0,0,0.96))]" : "absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(90deg,rgba(0,0,0,0.22),rgba(2,6,14,0.92)_52%,rgba(0,0,0,0.98))]"} />
          <div className="relative z-10 grid h-full gap-0 md:grid-cols-[46%_54%]" data-testid="ending-screen">
            <div className="relative min-h-[36vh] overflow-hidden border-b border-cyanline/20 md:min-h-0 md:border-b-0 md:border-r">
              {clearImage ? (
                <img src={clearImage} alt={clearTitle} className="h-full w-full object-cover" data-testid="ending-image" />
              ) : (
                <img src={chapter4ImageMap.chapter4CoreRoom} alt={clearTitle} className="h-full w-full object-cover opacity-70" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.35)),linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.72))]" />
              <div className="absolute bottom-7 left-7 right-7">
                <p className={`text-[10px] font-black uppercase tracking-[0.32em] ${isHiddenEnding ? "text-amber-100/90" : "text-cyan-200/85"}`}>{isHiddenEnding ? "히든 기록" : "엔딩 기록"}</p>
                <h2 className={`mt-3 text-5xl font-black leading-tight md:text-6xl ${isHiddenEnding ? "bg-gradient-to-r from-amber-100 via-cyan-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(250,204,21,0.18)]" : "text-white"}`} data-testid="ending-title">
                  {clearTitle}
                </h2>
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-slate-950/72 px-6 py-7 backdrop-blur-md md:px-10 md:py-9">
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isHiddenEnding ? "text-amber-100/75" : "text-cyan-300/70"}`}>{isHiddenEnding ? "이름이 빛을 되찾는다" : "ECHO는 아직 모른다"}</p>
                <div className="mt-7 space-y-5 text-base leading-8 text-slate-200 md:text-lg md:leading-9">
                  {clearLines.map((line, index) => {
                    const displayedLine = index === 1 ? formatEndingQuote(line) : line;

                    return (
                      <section
                        key={`${index}-${displayedLine}`}
                        className={`border-l px-5 py-4 ${
                          index === 1
                            ? "border-cyanline/55 bg-cyanline/8 text-cyan-50"
                            : "border-slate-600/35 bg-black/24 text-slate-200"
                        }`}
                        data-testid={index === 0 ? "ending-body" : index === 1 ? "ending-quote" : index === 2 ? "ending-memory-summary" : undefined}
                      >
                        <p className="whitespace-pre-line">{displayedLine}</p>
                      </section>
                    );
                  })}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3 border-t border-cyanline/15 pt-5">
                <button
                  className="border border-cyanline/60 bg-cyanline/15 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
                  onClick={onRestart}
                  data-testid="ending-restart-button"
                  type="button"
                >
                  처음으로
                </button>
                <button
                  className="border border-cyanline/35 bg-slate-950/70 px-5 py-3 text-sm font-bold text-slate-100 transition hover:border-cyanline hover:text-cyan-100"
                  onClick={onBranchPoint}
                  data-testid="ending-branch-button"
                  type="button"
                >
                  엔딩 분기 선택
                </button>

                {onReplayEndingMusic ? (
                  <button
                    className="border border-slate-500/70 bg-slate-950/70 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-cyanline hover:text-cyan-100"
                    onClick={onReplayEndingMusic}
                    type="button"
                  >
                    엔딩 음악 다시 듣기
                  </button>
                ) : null}
                <button
                  className="ml-auto border border-rose-300/35 bg-rose-950/20 px-5 py-3 text-sm font-bold text-rose-100 transition hover:border-rose-300/70"
                  onClick={onClearSave}
                  data-testid="ending-reset-save-button"
                  type="button"
                >
                  저장 데이터 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}








