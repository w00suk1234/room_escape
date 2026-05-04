"use client";

import { useEffect, useState } from "react";
import { InteractiveImageScene } from "@/components/InteractiveImageScene";
import { chapter1Hotspots, imageMap } from "@/data/chapter1";
import type { Chapter1ObjectId, ObjectId } from "@/types/game";

interface GameSceneProps {
  inspectedObjects: ObjectId[];
  chapterCleared: boolean;
  clearSummary: {
    requiredClues: string[];
    memoryCount: number;
  };
  onInspect: (objectId: Chapter1ObjectId) => void;
  onContinueChapter?: () => void;
}

export function GameScene({
  inspectedObjects,
  chapterCleared,
  clearSummary,
  onInspect,
  onContinueChapter,
}: GameSceneProps) {
  const [debugHotspots, setDebugHotspots] = useState(false);

  useEffect(() => {
    setDebugHotspots(process.env.NODE_ENV === "development" || window.localStorage.getItem("debugMode") === "true");
  }, []);

  return (
    <section
      className="glass-panel soft-glow relative h-full min-h-[420px] overflow-hidden bg-black fade-in"
      data-testid="chapter1-scene"
    >
      <InteractiveImageScene
        src={imageMap.roomMain}
        alt="격리실 내부"
        hotspots={chapter1Hotspots}
        completedIds={inspectedObjects}
        onHotspotClick={onInspect}
        debugHotspots={debugHotspots}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0,rgba(3,5,10,0.14)_42%,rgba(3,5,10,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,24,0.18),transparent_45%,rgba(0,0,0,0.42)_100%)]" />
        {!chapterCleared ? (
          <div className="pointer-events-none absolute left-[2.5%] top-[4%] max-w-[300px] border border-cyanline/10 bg-black/28 px-3 py-2 text-left opacity-72 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-300/55">SIGNAL TRACE</p>
            <p className="mt-1.5 text-xs font-semibold text-slate-200/85">낮은 통신 신호가 남아 있다</p>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400/85">방 안의 사물들은 잠금보다 먼저, 잃어버린 이름 쪽으로 이어진다.</p>
          </div>
        ) : null}
      </InteractiveImageScene>

      {chapterCleared ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/76 px-4 backdrop-blur-sm">
          <div className="glass-panel soft-glow w-full max-w-md p-7 text-left fade-in">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Door Unlocked</p>
            <h2 className="mt-3 text-4xl font-black text-white">Chapter 1 Clear</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
              <p>
                확보한 필수 단서:{" "}
                <span className="font-bold text-cyan-100">
                  {clearSummary.requiredClues.length > 0 ? clearSummary.requiredClues.join(", ") : "없음"}
                </span>
              </p>
              <p>
                발견한 기억 조각: <span className="font-bold text-cyan-100">{clearSummary.memoryCount}</span>
              </p>
              <p className="border-t border-cyanline/15 pt-3 text-cyan-100">다음 구역으로 이동 가능</p>
            </div>
            {onContinueChapter ? (
              <button
                className="mt-6 w-full border border-cyanline/60 bg-cyanline/15 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
                onClick={onContinueChapter}
                type="button"
              >
                Chapter 2로 이동
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}


