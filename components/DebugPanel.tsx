"use client";

import { useEffect, useState } from "react";
import type { EndingId } from "@/data/endings";
import type { Chapter, GameState } from "@/types/game";

type FlagGroup = "progressFlags" | "hiddenEndingFlags" | "serinRouteFlags" | "loreFlags";
type PresetId = "basic" | "serin" | "hidden" | "doctor";

interface DebugPanelProps {
  gameState: GameState;
  onGoToChapter: (chapter: Chapter) => void;
  onShowEnding: (endingId: EndingId) => void;
  onToggleFlag: (group: FlagGroup, key: string) => void;
  onApplyPreset: (presetId: PresetId) => void;
  onClearSave: () => void;
  onLogState: () => void;
}

const flagRows: { group: FlagGroup; key: string; label: string }[] = [
  { group: "hiddenEndingFlags", key: "foundNameFragment", label: "이름 조각" },
  { group: "hiddenEndingFlags", key: "foundTrashPhoto", label: "사진 조각" },
  { group: "serinRouteFlags", key: "foundSerinWarningNote", label: "세린 경고 메모" },
  { group: "loreFlags", key: "sawLockedEchoLog", label: "ECHO 로그" },
  { group: "hiddenEndingFlags", key: "confirmedIanName", label: "이안 이름 확인" },
  { group: "hiddenEndingFlags", key: "connectedSeohaToPhoto", label: "서하-사진 연결" },
  { group: "serinRouteFlags", key: "chapter3UnderstoodSerinMotive", label: "세린 동기 이해" },
  { group: "serinRouteFlags", key: "serinAllyCandidate", label: "세린 아군 후보" },
  { group: "serinRouteFlags", key: "chapter4SerinCanIntervene", label: "세린 개입 가능" },
  { group: "serinRouteFlags", key: "chapter4SerinBlocked", label: "세린 권한 차단" },
  { group: "loreFlags", key: "chapter3SawSeohaName", label: "서하 이름 확인" },
  { group: "progressFlags", key: "chapter3Cleared", label: "Ch3 Clear" },
  { group: "progressFlags", key: "chapter4FoundFinalSentenceFragment", label: "마지막 문장 조각" },
  { group: "progressFlags", key: "chapter4RestoredFinalSentence", label: "마지막 문장 복원" },
  { group: "progressFlags", key: "chapter4Cleared", label: "Ch4 Clear" },
];

const endingIds: EndingId[] = ["doctor_completion", "escape_alone", "coexistence", "hidden_seoha_name", "serin_betrayal"];

export function DebugPanel({
  gameState,
  onGoToChapter,
  onShowEnding,
  onToggleFlag,
  onApplyPreset,
  onClearSave,
  onLogState,
}: DebugPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setEnabled(true);
      return;
    }

    setEnabled(localStorage.getItem("debugMode") === "true");
  }, []);

  if (!enabled) {
    return null;
  }

  function flagValue(group: FlagGroup, key: string) {
    return Boolean((gameState[group] as unknown as Record<string, boolean>)[key]);
  }

  return (
    <div className="fixed bottom-3 right-3 z-[80] text-xs text-slate-100">
      {!open ? (
        <button
          className="border border-amber-300/50 bg-black/80 px-3 py-2 font-black text-amber-100 shadow-lg"
          data-testid="debug-toggle"
          onClick={() => setOpen(true)}
          type="button"
        >
          DEBUG
        </button>
      ) : (
        <section
          className="max-h-[82vh] w-[340px] overflow-y-auto border border-amber-300/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur"
          data-testid="debug-panel"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-black uppercase tracking-[0.2em] text-amber-200">Debug</p>
            <button
              className="text-slate-400 hover:text-white"
              data-testid="debug-close"
              onClick={() => setOpen(false)}
              type="button"
            >
              닫기
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-1 font-bold text-cyan-200">챕터 이동</p>
              <div className="grid grid-cols-2 gap-1">
                {[1, 2, 3, 4].map((chapter) => (
                  <button
                    key={chapter}
                    className="debug-btn"
                    data-testid={`debug-chapter-${chapter}`}
                    data-qa={`debug-go-chapter-${chapter}`}
                    onClick={() => onGoToChapter(chapter as Chapter)}
                    type="button"
                  >
                    Chapter {chapter}
                  </button>
                ))}
                <button
                  className="debug-btn col-span-2"
                  data-testid="debug-ending-screen"
                  onClick={() => onShowEnding("escape_alone")}
                  type="button"
                >
                  Ending 화면
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1 font-bold text-cyan-200">저장 상태</p>
              <div className="grid grid-cols-2 gap-1">
                <button className="debug-btn" data-testid="debug-state-log" onClick={onLogState} type="button">
                  state log
                </button>
                <button
                  className="debug-btn"
                  data-testid="debug-save-log"
                  onClick={() => console.log("localStorage save", localStorage.getItem("echo-doesnt-know-save"))}
                  type="button"
                >
                  save log
                </button>
                <button
                  className="debug-btn col-span-2 danger"
                  data-testid="debug-clear-save"
                  onClick={onClearSave}
                  type="button"
                >
                  저장 초기화
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1 font-bold text-cyan-200">플래그</p>
              <div className="grid gap-1">
                {flagRows.map((flag) => (
                  <button
                    key={`${flag.group}.${flag.key}`}
                    className={`debug-flag ${flagValue(flag.group, flag.key) ? "on" : ""}`}
                    data-testid={`debug-flag-${flag.group}-${flag.key}`}
                    onClick={() => onToggleFlag(flag.group, flag.key)}
                    type="button"
                  >
                    <span>{flag.label}</span>
                    <span>{flagValue(flag.group, flag.key) ? "ON" : "OFF"}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 font-bold text-cyan-200">프리셋</p>
              <div className="grid grid-cols-2 gap-1">
                <button className="debug-btn" data-testid="debug-preset-basic" onClick={() => onApplyPreset("basic")} type="button">
                  A 기본
                </button>
                <button className="debug-btn" data-testid="debug-preset-serin" onClick={() => onApplyPreset("serin")} type="button">
                  B 세린
                </button>
                <button className="debug-btn" data-testid="debug-preset-hidden" onClick={() => onApplyPreset("hidden")} type="button">
                  C 히든
                </button>
                <button className="debug-btn" data-testid="debug-preset-doctor" onClick={() => onApplyPreset("doctor")} type="button">
                  D 박사
                </button>
              </div>
            </div>

            <div>
              <p className="mb-1 font-bold text-cyan-200">엔딩 바로 보기</p>
              <div className="grid gap-1">
                {endingIds.map((endingId) => (
                  <button
                    key={endingId}
                    className="debug-btn"
                    data-testid={`debug-ending-${endingId}`}
                    data-qa={`debug-ending-${endingId}`}
                    onClick={() => onShowEnding(endingId)}
                    type="button"
                  >
                    {endingId}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      <style jsx>{`
        .debug-btn {
          border: 1px solid rgba(125, 211, 252, 0.28);
          background: rgba(8, 47, 73, 0.45);
          padding: 0.45rem 0.5rem;
          font-weight: 800;
          color: rgb(224, 242, 254);
          text-align: left;
        }
        .debug-btn:hover {
          border-color: rgba(251, 191, 36, 0.65);
        }
        .debug-btn.danger {
          border-color: rgba(251, 113, 133, 0.4);
          color: rgb(255, 228, 230);
        }
        .debug-flag {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: rgba(15, 23, 42, 0.78);
          padding: 0.4rem 0.5rem;
          text-align: left;
        }
        .debug-flag.on {
          border-color: rgba(45, 212, 191, 0.5);
          color: rgb(204, 251, 241);
        }
      `}</style>
    </div>
  );
}
