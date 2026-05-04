import type { Chapter3ImageKey, Chapter3ObjectId, HotspotConfig } from "@/types/game";

export const CHAPTER3_TITLE = "Chapter 3. 기억 실험실";
export const CHAPTER3_GOAL = "기억 실험 기록을 조사하고 박사의 진실에 접근하라";
export const CHAPTER3_QUESTION = "나는 피해자인가, 공동 설계자인가?";

export const chapter3ImageMap: Record<Chapter3ImageKey, string> = {
  chapter3MainLab: "/assets/chapter3/ch3_memory_lab_main.png",
  memoryCapsule: "/assets/chapter3/ch3_memory_capsule.png",
  doctorLog: "/assets/chapter3/ch3_research_terminal.png",
  serinFamilyRecord: "/assets/chapter3/ch3_research_terminal.png",
  echoOriginalData: "/assets/chapter3/ch3_research_terminal.png",
  consentForm: "/assets/chapter3/ch3_research_terminal.png",
};

export const chapter3ObjectLabels: Record<Chapter3ObjectId, string> = {
  memoryCapsule: "기억 캡슐",
  doctorLog: "박사 로그",
  serinFamilyRecord: "세린 가족 기록",
  echoOriginalData: "ECHO 원본 데이터",
  consentForm: "실험 동의서",
  experimentOrder: "실험 순서 복원",
};

export const chapter3Hotspots: HotspotConfig<Chapter3ObjectId>[] = [
  { id: "memoryCapsule", x: 37, y: 43, label: chapter3ObjectLabels.memoryCapsule, type: "progress", imageKey: "memoryCapsule", zIndex: 12 },
  { id: "doctorLog", x: 15, y: 50, label: chapter3ObjectLabels.doctorLog, type: "progress", imageKey: "doctorLog", zIndex: 12 },
  { id: "serinFamilyRecord", x: 58, y: 55, label: chapter3ObjectLabels.serinFamilyRecord, type: "serin", imageKey: "serinFamilyRecord", zIndex: 13 },
  { id: "echoOriginalData", x: 76, y: 45, label: chapter3ObjectLabels.echoOriginalData, type: "echo", imageKey: "echoOriginalData", zIndex: 12 },
  { id: "consentForm", x: 53, y: 81, label: chapter3ObjectLabels.consentForm, type: "memory", imageKey: "consentForm", zIndex: 13 },
  { id: "experimentOrder", x: 59, y: 63, label: chapter3ObjectLabels.experimentOrder, type: "progress", imageKey: "doctorLog", zIndex: 14 },
];

export const experimentOrderAnswer = ["서하 진단", "이안 동의", "ECHO 이식", "기억 봉인"];
export const experimentOrderCandidates = ["ECHO 이식", "서하 진단", "기억 봉인", "이안 동의", "초기화"];

