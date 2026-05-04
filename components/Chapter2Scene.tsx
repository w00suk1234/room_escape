"use client";

import { InteractiveImageScene } from "@/components/InteractiveImageScene";
import { chapter2Hotspots, chapter2ImageMap } from "@/data/chapter2";
import type { Chapter2ObjectId, ObjectId } from "@/types/game";

interface Chapter2SceneProps {
  inspectedObjects: ObjectId[];
  completedObjects?: string[];
  gateReady?: boolean;
  echoActive: boolean;
  serinSilhouetteActive: boolean;
  chapterCleared: boolean;
  onInspect: (objectId: Chapter2ObjectId) => void;
  onContinueChapter?: () => void;
}

export function Chapter2Scene({
  inspectedObjects,
  completedObjects = [],
  gateReady = false,
  echoActive,
  serinSilhouetteActive,
  chapterCleared,
  onInspect,
  onContinueChapter,
}: Chapter2SceneProps) {
  const visibleHotspots = chapter2Hotspots.map((hotspot) => {
    const completed = completedObjects.includes(hotspot.id);
    const statusLabel =
      hotspot.id === "securityGate" && gateReady && !completed ? `${hotspot.label}: 개방 가능` : hotspot.label;
    const hotspotWithStatus = { ...hotspot, label: statusLabel };

    if (hotspot.id === "echoHologram") {
      return { ...hotspotWithStatus, hiddenUntil: (echoActive && false) || inspectedObjects.includes("echoHologram") };
    }

    if (hotspot.id === "serinSilhouette") {
      return {
        ...hotspotWithStatus,
        hiddenUntil: (serinSilhouetteActive && false) || inspectedObjects.includes("serinSilhouette"),
      };
    }

    return hotspotWithStatus;
  });

  return (
    <section className="glass-panel soft-glow relative h-full min-h-[420px] overflow-hidden bg-black fade-in">
      <InteractiveImageScene
        src={chapter2ImageMap.chapter2MainCorridor}
        alt="관찰 구역 복도"
        hotspots={visibleHotspots}
        completedIds={[...new Set([...inspectedObjects, ...completedObjects])]}
        onHotspotClick={onInspect}
        showLabels
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_38%,transparent_0,rgba(3,5,10,0.12)_42%,rgba(3,5,10,0.66)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,13,24,0.16),transparent_45%,rgba(0,0,0,0.46)_100%)]" />
        {!chapterCleared ? (
          <div className="pointer-events-none absolute left-[2.5%] top-[4%] max-w-[315px] border border-cyanline/10 bg-black/28 px-3 py-2 text-left opacity-72 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-cyan-300/55">OBSERVATION LOG</p>
            <p className="mt-1.5 text-xs font-semibold text-slate-200/85">이곳은 밖이 아니라 보는 쪽이다</p>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400/85">
              꺼진 화면보다 흔들리는 기록이 더 많은 것을 말한다.
            </p>
          </div>
        ) : null}
      </InteractiveImageScene>

      {!chapterCleared ? (
        <div className="absolute bottom-4 left-4 z-20 max-w-[78%] border border-cyanline/20 bg-slate-950/46 p-3 opacity-78 backdrop-blur">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">주변 신호</p>
          <div className="flex flex-wrap gap-2">
            {visibleHotspots
              .filter((hotspot) => !("hiddenUntil" in hotspot) || hotspot.hiddenUntil !== false)
              .map((hotspot) => (
                <button
                  key={hotspot.id}
                  className={`border px-2.5 py-1.5 text-xs font-bold transition hover:border-cyanline hover:bg-cyanline/20 ${
                    completedObjects.includes(hotspot.id)
                      ? "border-slate-700/40 bg-black/55 text-slate-400"
                      : "border-cyanline/25 bg-cyanline/10 text-cyan-100"
                  }`}
                  onClick={() => onInspect(hotspot.id)}
                  type="button"
                >
                  {hotspot.label}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {chapterCleared ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/76 px-4 backdrop-blur-sm">
          <div className="glass-panel soft-glow w-full max-w-md p-7 text-left fade-in">
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Gate Unlocked</p>
            <h2 className="mt-3 text-3xl font-black text-white">관찰 구역 조사 완료</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-200">
              <p>감시 사각지대 확보.</p>
              <p>전력 분배 복구.</p>
              <p>보안 게이트 해제 완료.</p>
              <p className="border-t border-cyanline/15 pt-3 text-cyan-100">다음 구역: 기억 실험실</p>
            </div>
            {onContinueChapter ? (
              <button
                className="mt-7 border border-cyanline/60 bg-cyanline/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
                onClick={onContinueChapter}
                type="button"
              >
                기억 실험실로 이동
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

