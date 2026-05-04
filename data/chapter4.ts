import type { Chapter4ImageKey, Chapter4ObjectId, HotspotConfig } from "@/types/game";

export const CHAPTER4_TITLE = "Chapter 4. 코어 룸";
export const CHAPTER4_GOAL = "ECHO 코어와 마주하고 마지막 선택을 내려라";

export const chapter4ImageMap: Record<Chapter4ImageKey, string> = {
  chapter4CoreRoom: "/assets/chapter4/ch4_core_room_main.png",
  echoCore: "/assets/chapter4/ch4_echo_core_close.png",
  nodePanel: "/assets/chapter4/ch4_control_terminal.png",
  doctorTerminal: "/assets/chapter4/ch4_control_terminal.png",
  finalSentenceFragment: "/assets/chapter4/ch4_control_terminal.png",
  finalSentencePuzzle: "/assets/chapter4/ch4_control_terminal.png",
  coreChoiceTerminal: "/assets/chapter4/ch4_core_room_main.png",
  escapeGate: "/assets/chapter4/ch4_core_room_main.png",
};

export const chapter4ObjectLabels: Record<Chapter4ObjectId, string> = {
  echoCore: "ECHO 코어",
  nodePanel: "NODE 제어 패널",
  doctorTerminal: "박사 터미널",
  finalSentenceFragment: "마지막 문장 조각",
  finalSentencePuzzle: "마지막 문장 복원",
  coreChoiceTerminal: "코어 선택 장치",
  escapeGate: "코어 선택 장치",
};

export const chapter4Hotspots: HotspotConfig<Chapter4ObjectId>[] = [
  { id: "echoCore", x: 50, y: 42, label: chapter4ObjectLabels.echoCore, type: "echo", imageKey: "echoCore", zIndex: 13 },
  { id: "nodePanel", x: 34, y: 64, label: chapter4ObjectLabels.nodePanel, type: "lore", imageKey: "nodePanel", zIndex: 12 },
  { id: "doctorTerminal", x: 88, y: 70, label: chapter4ObjectLabels.doctorTerminal, type: "progress", imageKey: "doctorTerminal", zIndex: 12 },
  { id: "finalSentenceFragment", x: 58, y: 62, label: chapter4ObjectLabels.finalSentenceFragment, type: "memory", imageKey: "finalSentenceFragment", zIndex: 14 },
  { id: "finalSentencePuzzle", x: 50, y: 69, label: chapter4ObjectLabels.finalSentencePuzzle, type: "memory", imageKey: "finalSentencePuzzle", zIndex: 15 },
  { id: "coreChoiceTerminal", x: 50, y: 82, label: chapter4ObjectLabels.coreChoiceTerminal, type: "progress", imageKey: "coreChoiceTerminal", zIndex: 16 },
];

export const finalSentenceAnswer = ["나를", "완성하지 말고", "기억해줘"];
export const finalSentenceCandidates = ["나를", "살리지 말고", "완성하지 말고", "삭제하지 말고", "기억해줘", "돌아와줘"];
