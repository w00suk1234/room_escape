"use client";

import { InteractiveImageScene } from "@/components/InteractiveImageScene";
import { CHAPTER3_GOAL, chapter3Hotspots, chapter3ImageMap } from "@/data/chapter3";
import type { Chapter3ObjectId, ObjectId } from "@/types/game";

interface Chapter3SceneProps {
  inspectedObjects: ObjectId[];
  completedObjects?: string[];
  experimentOrderReady: boolean;
  chapterCleared: boolean;
  clearLines: string[];
  onInspect: (objectId: Chapter3ObjectId) => void;
  onContinueChapter?: () => void;
}

export function Chapter3Scene({
  inspectedObjects,
  completedObjects = [],
  experimentOrderReady,
  chapterCleared,
  clearLines,
  onInspect,
  onContinueChapter,
}: Chapter3SceneProps) {
  const completedIds = [...new Set([...inspectedObjects, ...completedObjects])];
  const visibleHotspots = chapter3Hotspots.map((hotspot) => {
    if (hotspot.id !== "experimentOrder") {
      return hotspot;
    }

    return {
      ...hotspot,
      label: experimentOrderReady ? "실험 순서 복원" : "실험 순서 복원: 잠김",
    };
  });

  return (
    <section className="glass-panel soft-glow relative h-full min-h-[420px] overflow-hidden bg-black fade-in" data-testid="chapter3-scene">
      <InteractiveImageScene
        src={chapter3ImageMap.chapter3MainLab}
        alt="기억 실험실"
        hotspots={visibleHotspots}
        completedIds={completedIds}
        onHotspotClick={onInspect}
        showLabels
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_40%,transparent_0,rgba(3,5,10,0.1)_42%,rgba(3,5,10,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,24,0.08),transparent_42%,rgba(0,0,0,0.42)_100%)]" />
        <div className="absolute left-[3%] top-[5%] max-w-[360px] border border-cyanline/20 bg-black/45 px-4 py-3 backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-300/80">Chapter 3. 기억 실험실</p>
          <p className="mt-2 text-sm font-bold text-slate-100">{CHAPTER3_GOAL}</p>
          <p className="mt-2 text-xs italic text-slate-400">나는 피해자인가, 공범인가?</p>
          <p className="mt-3 text-xs leading-5 text-slate-300">
            권장 순서: 기억 캡슐 → 박사 로그 → ECHO 원본 데이터 → 실험 동의서 → 실험 순서 복원
          </p>
          <p className="mt-1 text-xs leading-5 text-cyan-100/80">기록이 모이면 뒤섞인 실험 순서가 열린다.</p>
        </div>
      </InteractiveImageScene>

      {chapterCleared ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/76 px-4 backdrop-blur-sm" data-testid="chapter-clear-overlay">
          <div className="glass-panel soft-glow w-full max-w-md p-7 text-left fade-in">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Memory Lab Restored</p>
            <h2 className="mt-3 text-3xl font-black text-white" data-testid="chapter-clear-title">
              기억 실험실 조사 완료
            </h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
              {clearLines.map((line) => (
                <p key={line} className="whitespace-pre-line">
                  {line}
                </p>
              ))}
            </div>
            {onContinueChapter ? (
              <button
                className="mt-7 border border-cyanline/60 bg-cyanline/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
                onClick={onContinueChapter}
                type="button"
              >
                코어 룸으로 이동
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
