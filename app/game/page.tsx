"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioControls } from "@/components/AudioControls";
import { Chapter2Scene } from "@/components/Chapter2Scene";
import { Chapter3Scene } from "@/components/Chapter3Scene";
import { Chapter4Scene } from "@/components/Chapter4Scene";
import { DialogueBox, type DialogueLine } from "@/components/DialogueBox";
import { GameScene } from "@/components/GameScene";
import { HudBar } from "@/components/HudBar";
import { ImageArchive } from "@/components/ImageArchive";
import { InventoryBar } from "@/components/InventoryBar";
import { InvestigationModal } from "@/components/InvestigationModal";
import { PuzzleModal } from "@/components/PuzzleModal";
import { StartScreen } from "@/components/StartScreen";
import {
  CHAPTER_GOAL,
  CHAPTER_TITLE,
  DOOR_PASSWORD,
  deskMemoPuzzleText,
  imageMap,
  inventoryItems,
  objectLabels,
} from "@/data/chapter1";
import { CHAPTER2_GOAL, CHAPTER2_TITLE, chapter2ImageMap, chapter2ObjectLabels } from "@/data/chapter2";
import {
  CHAPTER3_GOAL,
  CHAPTER3_TITLE,
  chapter3ImageMap,
  chapter3ObjectLabels,
  experimentOrderAnswer,
  experimentOrderCandidates,
} from "@/data/chapter3";
import {
  CHAPTER4_GOAL,
  CHAPTER4_TITLE,
  chapter4ImageMap,
  chapter4ObjectLabels,
  finalSentenceAnswer,
  finalSentenceCandidates,
} from "@/data/chapter4";
import { endingContentMap, endingImageMap, type EndingId } from "@/data/endings";
import { useAudioManager } from "@/hooks/useAudioManager";
import { addItem, createInitialGameState, hasItem, makeLog, markInspected } from "@/lib/game-state";
import { clearSavedGame, hasSavedGame, loadGame, saveGame } from "@/lib/local-save";
import { createMockHint } from "@/lib/mock-ai";
import type {
  Chapter1ObjectId,
  Chapter2ObjectId,
  Chapter3ObjectId,
  Chapter4ObjectId,
  ClueAnalysisResponse,
  EchoReplyResponse,
  GameState,
  HintResponse,
  ItemId,
  ObjectId,
} from "@/types/game";

type ModalPrimaryAction =
  | "openPuzzle"
  | "unlockChapter2Gate"
  | "restoreExperimentOrder"
  | "restoreFinalSentence"
  | "openFinalChoice";
type PowerStep = "observation" | "comms" | "gate";

interface ModalState {
  title: string;
  description: string;
  imageSrc?: string;
  items?: string[];
  eyebrow?: string;
  actionLabel?: string;
  primaryAction?: ModalPrimaryAction;
  primaryActionLabel?: string;
  choiceActions?: {
    label: string;
    description?: string;
    onClick: () => void;
    tone?: "default" | "danger";
    testId?: string;
  }[];
  size?: "normal" | "wide";
}

const POWER_SEQUENCE: PowerStep[] = ["observation", "comms", "gate"];

function normalizePowerSequence(sequence: string[] | undefined): PowerStep[] {
  return (sequence ?? []).filter((step): step is PowerStep =>
    POWER_SEQUENCE.includes(step as PowerStep)
  );
}

export default function GamePage() {
  const audio = useAudioManager();
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [hasSave, setHasSave] = useState(false);
  const [showImageArchive, setShowImageArchive] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [dialogueQueue, setDialogueQueue] = useState<DialogueLine[]>([]);
  const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
  const [puzzleError, setPuzzleError] = useState("");
  const [wrongCodeCount, setWrongCodeCount] = useState(0);
  const [suspicionPulse, setSuspicionPulse] = useState(false);
  const [powerSequence, setPowerSequence] = useState<PowerStep[]>([]);
  const [requiredChoiceProgress, setRequiredChoiceProgress] = useState<Record<string, string[]>>({});
  const powerSequenceRef = useRef<PowerStep[]>([]);
  const requiredChoiceProgressRef = useRef<Record<string, string[]>>({});

  const activeDialogue = dialogueQueue[0] ?? null;
  const chapter2EchoActive = false;
  const chapter2SerinSilhouetteActive = false;
  const chapter2GateReady = gameState.progressFlags.chapter2FoundBlindSpot && gameState.progressFlags.chapter2PowerRestored;
  const chapter2CompletedObjects = [
    ...(gameState.progressFlags.chapter2SawObservationWindow ? ["observationWindow"] : []),
    ...(gameState.progressFlags.chapter2SawSurveillanceRoom ? ["surveillanceRoom"] : []),
    ...(gameState.progressFlags.chapter2FoundBlindSpot ? ["cctvGrid"] : []),
    ...(gameState.progressFlags.chapter2PowerRestored ? ["powerPanel"] : []),
    ...(gameState.progressFlags.chapter2RestoredSerinComms ? ["communicationConsole"] : []),
    ...(gameState.progressFlags.chapter2MetEcho ? ["echoHologram"] : []),
    ...(gameState.serinRouteFlags.chapter2SawSerinSilhouette ? ["serinSilhouette"] : []),
    ...(gameState.progressFlags.chapter2GateUnlocked ? ["securityGate"] : []),
  ];
  const chapter4FinalSentenceReady =
    gameState.progressFlags.chapter4SawEchoCore &&
    gameState.progressFlags.chapter4SawDoctorTerminal &&
    (gameState.progressFlags.chapter4FoundFinalSentenceFragment ||
      gameState.progressFlags.chapter4FoundFinalSentenceFragments);
  const chapter4FinalChoiceReady = gameState.progressFlags.chapter4RestoredFinalSentence;

  useEffect(() => {
    if (gameState.currentScreen !== "game") {
      audio.stopBgm();
      return;
    }

    if (gameState.endingId) {
      audio.playEndingMusic(gameState.endingId as EndingId);
      return;
    }

    audio.switchBgm(`chapter${gameState.chapter}` as "chapter1" | "chapter2" | "chapter3" | "chapter4");
  }, [
    audio.audioUnlocked,
    audio.settings.muted,
    audio.settings.masterVolume,
    audio.settings.bgmVolume,
    gameState.chapter,
    gameState.currentScreen,
    gameState.endingId,
  ]);

  const chapter1ClearSummary = useMemo(
    () => ({
      requiredClues: [
        gameState.progressFlags.foundDeskMemo ? "책상 위 메모" : null,
        gameState.progressFlags.foundAccessCard ? "카드키" : null,
      ].filter(Boolean) as string[],
      memoryCount:
        Number(gameState.hiddenEndingFlags.foundNameFragment) +
        Number(gameState.hiddenEndingFlags.foundTrashPhoto),
    }),
    [gameState]
  );

  const endingClearLines = useMemo(() => {
    if (!gameState.endingId) {
      return [gameState.endingDescription ?? "엔딩이 기록되었다."];
    }

    const ending = endingContentMap[gameState.endingId as EndingId];
    const discoveredMemories = [
      gameState.hiddenEndingFlags.foundNameFragment ? "이름의 조각" : null,
      gameState.hiddenEndingFlags.foundTrashPhoto ? "바다의 사진" : null,
      gameState.serinRouteFlags.foundSerinWarningNote ? "세린의 경고" : null,
      gameState.hiddenEndingFlags.confirmedIanName ? "이안의 이름" : null,
      gameState.hiddenEndingFlags.connectedSeohaToPhoto ? "서하의 이름" : null,
      gameState.progressFlags.chapter4RestoredFinalSentence ? "마지막 문장" : null,
    ].filter(Boolean);

    return [
      ending.description,
      ending.quote,
      discoveredMemories.length > 0
        ? `발견한 기억\n- ${discoveredMemories.join("\n- ")}`
        : "일부 기억은 끝내 복원되지 않았다.",
    ];
  }, [gameState]);

  useEffect(() => {
    setHasSave(hasSavedGame());
  }, []);

  useEffect(() => {
    if (gameState.currentScreen !== "start") {
      saveGame(gameState);
      setHasSave(true);
    }
  }, [gameState]);

  useEffect(() => {
    if (!suspicionPulse) {
      return;
    }

    const timeout = window.setTimeout(() => setSuspicionPulse(false), 650);
    return () => window.clearTimeout(timeout);
  }, [suspicionPulse]);

  function startNewGame() {
    audio.unlockAudio();
    audio.playSfx("click");
    powerSequenceRef.current = [];
    const next = {
      ...createInitialGameState(),
      currentScreen: "game" as const,
      logs: [
        makeLog("node", "NODE", "사용자 식별 실패. 기억 손상 프로토콜 확인."),
        makeLog("node", "NODE", "격리 절차 재개."),
        makeLog("system", "무전기", "치직... 치지직... 신호가 아주 낮게 살아난다."),
        makeLog("serin", "한세린", "이 방의 기록은 누군가가 의도적으로 순서를 바꿔뒀어요."),
      ],
    };
    setGameState(next);
    requiredChoiceProgressRef.current = {};
    setRequiredChoiceProgress({});
    setModal(null);
    setAnalysis(null);
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "사용자 식별 실패. 기억 손상 프로토콜 확인." },
      { speaker: "NODE", tone: "node", text: "격리 절차 재개." },
      { speaker: "무전기", tone: "system", text: "치직... 치지직... 신호가 아주 낮게 살아난다." },
      { speaker: "한세린", tone: "serin", text: "이 기록을 보고 있다면, 당신은 다시 깨어난 겁니다." },
      { speaker: "한세린", tone: "serin", text: "지금 들리는 목소리들을 전부 믿지는 마세요." },
      { speaker: "한세린", tone: "serin", text: "이 방의 기록은 누군가가 의도적으로 순서를 바꿔뒀어요." },
      { speaker: "한세린", tone: "serin", text: "문을 열기 전에 먼저 확인해야 합니다." },
      { speaker: "한세린", tone: "serin", text: "당신이 누구였는지, 그리고 누가 당신을 관찰하고 있었는지." },
      { speaker: "이안", tone: "player", text: "침대, 책상, 문 패널. 치료실이라기엔 모든 것이 너무 정확히 배치되어 있다." },
    ]);
    setPuzzleError("");
    setWrongCodeCount(0);
  }

  function continueGame() {
    audio.unlockAudio();
    audio.playSfx("click");
    const loaded = loadGame();
    if (loaded) {
      setGameState(loaded);
      requiredChoiceProgressRef.current = {};
      setRequiredChoiceProgress({});
      powerSequenceRef.current = normalizePowerSequence(loaded.chapter2PowerSequence);
      setModal(null);
      setAnalysis(null);
      setDialogueQueue([]);
    }
  }

  function clearSave() {
    audio.playSfx("click");
    clearSavedGame();
    setHasSave(false);
    setGameState(createInitialGameState());
    requiredChoiceProgressRef.current = {};
    setRequiredChoiceProgress({});
    setModal(null);
    setAnalysis(null);
    setDialogueQueue([]);
  }

  function returnToStartScreen() {
    audio.playSfx("click");
    setGameState(createInitialGameState());
    requiredChoiceProgressRef.current = {};
    setRequiredChoiceProgress({});
    setModal(null);
    setAnalysis(null);
    setIsPuzzleOpen(false);
    setDialogueQueue([]);
    setPuzzleError("");
    setWrongCodeCount(0);
  }

  function advancePrologue() {
    setGameState((state) => ({
      ...state,
      currentScreen: "game",
      logs: [
        makeLog("node", "NODE", "사용자 식별 실패. 기억 손상 프로토콜 확인."),
        makeLog("node", "NODE", "격리 절차 재개."),
        makeLog("serin", "한세린", "이 기록을 보고 있다면, 당신은 다시 깨어난 겁니다."),
        makeLog("serin", "한세린", "지금 들리는 목소리들을 전부 믿지는 마세요."),
      ],
    }));
    setDialogueQueue([
      { speaker: "한세린", tone: "serin", text: "문을 열기 전에, 먼저 당신이 누구였는지 떠올려야 해요." },
      { speaker: "NODE", tone: "node", text: "격리실 A-0427. 감시 절차를 재개합니다." },
    ]);
  }

  function startChapter2() {
    audio.unlockAudio();
    audio.playSfx("click");
    setWrongCodeCount(0);
    setPowerSequence([]);
    powerSequenceRef.current = [];
    setPuzzleError("");
    setIsPuzzleOpen(false);
    setModal(null);
    setAnalysis(null);
    requiredChoiceProgressRef.current = { ...requiredChoiceProgressRef.current, chapter2Intro: [] };
    setRequiredChoiceProgress((progress) => ({ ...progress, chapter2Intro: [] }));
    setGameState((state) => ({
      ...state,
      chapter: 2,
      currentScreen: "game",
      chapterCleared: state.progressFlags.chapter2Cleared,
      progressFlags: {
        ...state.progressFlags,
        chapter2Started: true,
      },
      logs: [
        makeLog("node", "NODE", "격리실 문 개방 기록 확인. 관찰 대상 위치 재확인 중."),
        makeLog("echo", "ECHO", "복도 통신망에서 ECHO 신호가 감지되었다."),
        makeLog("serin", "한세린", "관찰 구역에서 감시망을 속여야 한다."),
      ],
    }));
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "격리실 문 개방 기록 확인. 관찰 대상 위치 재확인 중." },
      { speaker: "이안", tone: "player", text: "문은 열렸는데, 복도 공기까지 감시당하는 느낌이다." },
      { speaker: "한세린", tone: "serin", text: "주변을 먼저 보세요. 방 밖으로 나온 게 끝이 아닙니다. 여긴 관찰 구역이에요." },
      { speaker: "이안", tone: "player", text: "관찰 구역?" },
      { speaker: "한세린", tone: "serin", text: "당신이 있던 방을 이쪽에서 보고 있었을 겁니다. 관찰창과 감시실 기록을 확인하세요." },
      { speaker: "ECHO", tone: "echo", text: "이안. 호흡이 불안정합니다. 천천히 걸으세요." },
      { speaker: "이안", tone: "player", text: "방금 목소리는... 세린이 아니야." },
      { speaker: "한세린", tone: "serin", text: "ECHO입니다. 따라가지 마세요. 그녀는 당신을 걱정하는 것처럼 말하지만, 자신이 왜 그러는지 모릅니다." },
      { speaker: "한세린", tone: "serin", text: "여기서는 문을 힘으로 여는 게 목표가 아니에요. NODE가 아직 당신이 격리실 안에 있다고 믿게 만들어야 합니다." },
      { speaker: "한세린", tone: "serin", text: "보이는 길보다 기록을 보세요. CCTV 루프를 찾고, 눈과 목소리와 문을 순서대로 깨우면 됩니다." },
      {
        speaker: "이안",
        tone: "player",
        text: "밖으로 나왔는데도 더 깊이 갇힌 기분이 든다.",
        choices: [
          { label: "어디부터 봐야 하죠?", onSelect: () => showChapter2RequiredChoice("어디부터 봐야 하죠?") },
          { label: "ECHO는 왜 나를 부르죠?", onSelect: () => showChapter2RequiredChoice("ECHO는 왜 나를 부르죠?") },
        ],
      },
    ]);
  }

  function startChapter3() {
    audio.unlockAudio();
    audio.playSfx("click");
    setWrongCodeCount(0);
    setPowerSequence([]);
    powerSequenceRef.current = [];
    setPuzzleError("");
    setIsPuzzleOpen(false);
    setModal(null);
    setAnalysis(null);
    requiredChoiceProgressRef.current = { ...requiredChoiceProgressRef.current, chapter3Intro: [] };
    setRequiredChoiceProgress((progress) => ({ ...progress, chapter3Intro: [] }));
    setGameState((state) => ({
      ...state,
      chapter: 3,
      currentScreen: "game",
      chapterCleared: state.progressFlags.chapter3Cleared,
      progressFlags: {
        ...state.progressFlags,
        chapter3Started: true,
      },
      logs: [
        ...state.logs,
        makeLog("node", "NODE", "미식별 접근자 감지."),
        makeLog("node", "NODE", "접근자 권한 일부가 내부 기록과 일치합니다."),
        makeLog("system", "목표", "기억 실험 기록을 조사하고 박사의 진실에 접근하라."),
      ],
    }));
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "미식별 접근자 감지. 기억 실험 구역 접근 권한 확인 중." },
      { speaker: "NODE", tone: "node", text: "오류. 접근자 권한 일부가 내부 기록과 일치합니다." },
      { speaker: "이안", tone: "player", text: "내 권한이... 여기에 있다고?" },
      { speaker: "ECHO", tone: "echo", text: "이곳은 닫혀 있어야 했습니다. 당신에게도, 저에게도." },
      { speaker: "한세린", tone: "serin", text: "기록을 보세요. 하지만 조심하세요. 박사의 기록은 사실만 말하지 않습니다." },
      { speaker: "한세린", tone: "serin", text: "그가 믿고 싶은 방식으로 정리된 사실을 말해요." },
      { speaker: "한세린", tone: "serin", text: "기록은 순서대로 보세요. 당신의 흔적, 박사의 목적, ECHO의 원본, 그리고 당신의 서명." },
      {
        speaker: "이안",
        tone: "player",
        text: "감시실 너머에는 실험실이 있었다. 그리고 이곳은 나를 기다리고 있었던 것처럼 조용했다.",
        choices: [
          { label: "무엇부터 확인해야 하지?", onSelect: () => showChapter3RequiredChoice("무엇부터 확인해야 하지?") },
          { label: "내 권한이 왜 여기에 있지?", onSelect: () => showChapter3RequiredChoice("내 권한이 왜 여기에 있지?") },
        ],
      },
    ]);
  }

  function startChapter4() {
    audio.unlockAudio();
    audio.playSfx("click");
    setPuzzleError("");
    setIsPuzzleOpen(false);
    setModal(null);
    setAnalysis(null);
    requiredChoiceProgressRef.current = { ...requiredChoiceProgressRef.current, chapter4Intro: [] };
    setRequiredChoiceProgress((progress) => ({ ...progress, chapter4Intro: [] }));
    setGameState((state) => ({
      ...state,
      chapter: 4,
      currentScreen: "game",
      chapterCleared: state.progressFlags.chapter4Cleared,
      progressFlags: { ...state.progressFlags, chapter4Started: true },
      logs: [
        ...state.logs,
        makeLog("node", "NODE", "코어 룸 접근 감지. 공동 설계자 기록과 격리 대상 기록이 동시에 확인된다."),
        makeLog("echo", "ECHO", "코어가 ECHO를 부르고 있다."),
      ],
    }));
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "코어 룸 접근 감지. 접근자 권한 확인 중." },
      { speaker: "NODE", tone: "node", text: "권한 충돌. 공동 설계자 기록과 격리 대상 기록이 동시에 확인됩니다." },
      { speaker: "이안", tone: "player", text: "끝까지 나를 둘로 나누는군." },
      { speaker: "차도윤 원격 송신", tone: "system", text: "아니. 자네는 원래부터 둘이었네. 그녀를 살리고 싶었던 사람과, 그 선택을 잊고 싶었던 사람." },
      { speaker: "ECHO", tone: "echo", text: "코어가... 저를 부르고 있습니다. 하지만 그곳에 가까워질수록 제가 무엇인지 더 흐려집니다." },
      { speaker: "한세린", tone: "serin", text: "먼저 ECHO 코어를 확인하세요. 그다음 NODE 제어 패널과 박사의 터미널을 봐야 선택의 의미를 알 수 있습니다." },
      { speaker: "한세린", tone: "serin", text: "마지막 문장은 가장 나중입니다. 박사는 그 문장을 완성 명령으로 읽었지만, 저는 부탁이었다고 생각해요." },
      { speaker: "한세린", tone: "serin", text: "그 문장은 코어의 권한키예요. 잘못 읽으면 기억이 아니라 명령이 됩니다." },
      { speaker: "이안", tone: "player", text: "감시를 속였고, 기록을 복원했다. 이제 남은 건 문이 아니라 선택이었다." },
      {
        speaker: "이안",
        tone: "player",
        text: "살린다는 말과 완성한다는 말이 같은 뜻인지, 이제 확인해야 한다.",
        choices: [
          { label: "선택 전에 뭘 봐야 하지?", onSelect: () => showChapter4RequiredChoice("선택 전에 뭘 봐야 하지?") },
          { label: "ECHO에게 선택권이 있을까?", onSelect: () => showChapter4RequiredChoice("ECHO에게 선택권이 있을까?") },
        ],
      },
    ]);
    return;

    audio.unlockAudio();
    audio.playSfx("click");
    setPuzzleError("");
    setIsPuzzleOpen(false);
    setModal(null);
    setAnalysis(null);
    setGameState((state) => ({
      ...state,
      chapter: 4,
      currentScreen: "game",
      chapterCleared: state.progressFlags.chapter4Cleared,
      logs: [
        ...state.logs,
        makeLog("node", "NODE", "ECHO 코어 룸 접근."),
        makeLog("echo", "ECHO", "당신을 알아야 할 것 같아요."),
      ],
    }));
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "ECHO 코어 룸 접근." },
      { speaker: "ECHO", tone: "echo", text: "당신을 알아야 할 것 같아요. 그런데 왜 기억나지 않죠?" },
      { speaker: "차도윤 원격 송신", tone: "system", text: "마지막 문장만 있으면 모든 것이 완성된다." },
    ]);
  }

  function showChapter2RouteGuide() {
    setDialogueQueue([
      { speaker: "한세린", tone: "serin", text: "먼저 관찰창을 보세요. 그곳에서 당신이 있던 방이 어떤 용도였는지 알 수 있습니다." },
      { speaker: "한세린", tone: "serin", text: "그다음 감시실 기록을 확인하세요. 기록을 봐야 CCTV 피드에서 어떤 화면이 가짜인지 판단할 수 있어요." },
      { speaker: "한세린", tone: "serin", text: "눈이 잠든 뒤에, 목소리가 돌아오고, 문은 마지막에 깨어납니다. 그 순서를 기억하세요." },
    ]);
  }

  function showChapter2EchoGuide() {
    setDialogueQueue([
      { speaker: "한세린", tone: "serin", text: "ECHO는 박사의 명령으로 움직이지만, 당신에게만 이상 반응을 보입니다." },
      { speaker: "한세린", tone: "serin", text: "그녀가 거짓말을 한다기보다, 자신이 왜 당신을 아는지 모르는 상태에 가까워요." },
      { speaker: "이안", tone: "player", text: "믿을 수도, 무시할 수도 없는 목소리군." },
    ]);
  }

  function showChapter2RequiredChoice(choiceId: "어디부터 봐야 하죠?" | "ECHO는 왜 나를 부르죠?") {
    const choiceLine: DialogueLine = {
      speaker: "이안",
      tone: "player",
      text: "아직 모르는 게 남아 있다. 그냥 움직이기 전에 확인해야 한다.",
      choices: [
        { label: "어디부터 봐야 하죠?", onSelect: () => showChapter2RequiredChoice("어디부터 봐야 하죠?") },
        { label: "ECHO는 왜 나를 부르죠?", onSelect: () => showChapter2RequiredChoice("ECHO는 왜 나를 부르죠?") },
      ],
    };
    const responses: Record<typeof choiceId, DialogueLine[]> = {
      "어디부터 봐야 하죠?": [
        { speaker: "한세린", tone: "serin", text: "먼저 관찰창을 보세요. 그곳에서 당신이 있던 방이 어떤 용도였는지 알 수 있습니다." },
        { speaker: "한세린", tone: "serin", text: "그다음 감시실 기록을 확인하세요. 기록을 봐야 CCTV 피드에서 어떤 화면이 가짜인지 판단할 수 있어요." },
        { speaker: "한세린", tone: "serin", text: "눈이 잠든 뒤에, 목소리가 돌아오고, 문은 마지막에 깨어납니다. 그 순서를 기억하세요." },
      ],
      "ECHO는 왜 나를 부르죠?": [
        { speaker: "한세린", tone: "serin", text: "ECHO는 박사의 명령으로 움직이지만, 당신에게만 이상 반응을 보입니다." },
        { speaker: "한세린", tone: "serin", text: "그녀가 거짓말을 한다기보다, 자신이 왜 당신을 아는지 모르는 상태에 가까워요." },
        { speaker: "이안", tone: "player", text: "믿을 수도, 무시할 수도 없는 목소리군." },
      ],
    };

    runRequiredChoice("chapter2Intro", choiceId, responses[choiceId], choiceLine);
  }

  function showChapter3InvestigationGuide() {
    setDialogueQueue([
      { speaker: "한세린", tone: "serin", text: "먼저 기억 캡슐을 보세요. 그 장치에 당신의 생체 기록이 남아 있을 겁니다." },
      { speaker: "한세린", tone: "serin", text: "그다음 박사 로그와 ECHO 원본 데이터를 확인하세요. 박사가 무엇을 완성하려 했는지, ECHO가 누구였는지 보일 거예요." },
      { speaker: "한세린", tone: "serin", text: "마지막으로 실험 동의서를 보세요. 그 기록을 보기 전에는 실험 순서를 복원해도 의미가 이어지지 않습니다." },
    ]);
  }

  function showChapter3ResponsibilityGuide() {
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "접근자 권한 일부가 내부 설계자 기록과 일치합니다." },
      { speaker: "ECHO", tone: "echo", text: "당신은 이곳을 처음 보는 사람이 아닙니다. 저도... 그 사실이 두렵습니다." },
      { speaker: "이안", tone: "player", text: "내가 피해자였는지, 이 실험을 시작한 사람 중 하나였는지. 이제 그걸 확인해야 한다." },
    ]);
  }

  function showChapter3RequiredChoice(choiceId: "무엇부터 확인해야 하지?" | "내 권한이 왜 여기에 있지?") {
    const choiceLine: DialogueLine = {
      speaker: "이안",
      tone: "player",
      text: "기록을 보기 전에, 무엇을 놓치고 있는지 정리해야 한다.",
      choices: [
        { label: "무엇부터 확인해야 하지?", onSelect: () => showChapter3RequiredChoice("무엇부터 확인해야 하지?") },
        { label: "내 권한이 왜 여기에 있지?", onSelect: () => showChapter3RequiredChoice("내 권한이 왜 여기에 있지?") },
      ],
    };
    const responses: Record<typeof choiceId, DialogueLine[]> = {
      "무엇부터 확인해야 하지?": [
        { speaker: "한세린", tone: "serin", text: "먼저 기억 캡슐을 보세요. 그 장치에 당신의 생체 기록이 남아 있을 겁니다." },
        { speaker: "한세린", tone: "serin", text: "그다음 박사 로그와 ECHO 원본 데이터를 확인하세요. 박사가 무엇을 완성하려 했는지, ECHO가 누구였는지 보일 거예요." },
        { speaker: "한세린", tone: "serin", text: "마지막으로 실험 동의서를 보세요. 그 기록을 보기 전에는 실험 순서를 복원해도 의미가 이어지지 않습니다." },
      ],
      "내 권한이 왜 여기에 있지?": [
        { speaker: "NODE", tone: "node", text: "접근자 권한 일부가 내부 설계자 기록과 일치합니다." },
        { speaker: "ECHO", tone: "echo", text: "당신은 이곳을 처음 보는 사람이 아닙니다. 저도... 그 사실이 두렵습니다." },
        { speaker: "이안", tone: "player", text: "내가 피해자였는지, 이 실험을 시작한 사람 중 하나였는지. 이제 그걸 확인해야 한다." },
      ],
    };

    runRequiredChoice("chapter3Intro", choiceId, responses[choiceId], choiceLine);
  }

  function showChapter4ChoiceGuide() {
    setDialogueQueue([
      { speaker: "한세린", tone: "serin", text: "ECHO 코어는 그녀가 무엇인지 보여줍니다. NODE 패널은 박사가 그녀를 어디에 쓰려 했는지 보여주고요." },
      { speaker: "한세린", tone: "serin", text: "박사 터미널을 보면 완성이 왜 위험한지 알 수 있습니다. 박사는 마지막 문장을 구원이 아니라 권한 이전 키로 쓰려 합니다." },
      { speaker: "이안", tone: "player", text: "선택은 마지막에 해야 한다. 먼저 무엇을 살리려는 건지 봐야 한다." },
    ]);
  }

  function showChapter4EchoChoiceGuide() {
    setDialogueQueue([
      { speaker: "ECHO", tone: "echo", text: "제가 선택해도 되는 존재인지 모르겠습니다." },
      { speaker: "이안", tone: "player", text: "그걸 내가 정하는 순간, 박사와 다를 게 없어질지도 몰라." },
      { speaker: "한세린", tone: "serin", text: "제가 끝까지 도울 수 있는지는, 당신이 제 사정을 얼마나 이해했는지에 달려 있습니다." },
    ]);
  }

  function showChapter4RequiredChoice(choiceId: "선택 전에 뭘 봐야 하지?" | "ECHO에게 선택권이 있을까?") {
    const choiceLine: DialogueLine = {
      speaker: "이안",
      tone: "player",
      text: "마지막 선택 전에, 아직 확인해야 할 질문이 남아 있다.",
      choices: [
        { label: "선택 전에 뭘 봐야 하지?", onSelect: () => showChapter4RequiredChoice("선택 전에 뭘 봐야 하지?") },
        { label: "ECHO에게 선택권이 있을까?", onSelect: () => showChapter4RequiredChoice("ECHO에게 선택권이 있을까?") },
      ],
    };
    const responses: Record<typeof choiceId, DialogueLine[]> = {
      "선택 전에 뭘 봐야 하지?": [
        { speaker: "한세린", tone: "serin", text: "ECHO 코어는 그녀가 무엇인지 보여줍니다. NODE 패널은 박사가 그녀를 어디에 쓰려 했는지 보여주고요." },
        { speaker: "한세린", tone: "serin", text: "박사 터미널을 보면 완성이 왜 위험한지 알 수 있습니다. 박사는 마지막 문장을 구원이 아니라 권한 이전 키로 쓰려 합니다." },
        { speaker: "이안", tone: "player", text: "선택은 마지막에 해야 한다. 먼저 무엇을 살리려는 건지 봐야 한다." },
      ],
      "ECHO에게 선택권이 있을까?": [
        { speaker: "ECHO", tone: "echo", text: "제가 선택해도 되는 존재인지 모르겠습니다." },
        { speaker: "이안", tone: "player", text: "그걸 내가 정하는 순간, 박사와 다를 게 없어질지도 몰라." },
        { speaker: "한세린", tone: "serin", text: "제가 끝까지 도울 수 있는지는, 당신이 제 사정을 얼마나 이해했는지에 달려 있습니다." },
      ],
    };

    runRequiredChoice("chapter4Intro", choiceId, responses[choiceId], choiceLine);
  }

  function pushDialogue(lines: DialogueLine[]) {
    setDialogueQueue((queue) => [...queue, ...lines]);
  }

  function nextDialogue() {
    audio.playSfx("click");
    setDialogueQueue((queue) => queue.slice(1));
  }

  function increaseExposure(state: GameState, amount: number): GameState {
    const nextValue = Math.min(100, state.systemExposure + amount);
    return {
      ...state,
      systemExposure: nextValue,
      suspicion: nextValue,
    };
  }

  function commit(next: GameState) {
    setGameState(next);
  }

  function addLogToState(state: GameState, tone: Parameters<typeof makeLog>[0], speaker: string, message: string) {
    return {
      ...state,
      logs: [...state.logs, makeLog(tone, speaker, message)],
    };
  }

  function imageForItem(itemId: ItemId) {
    const map: Record<ItemId, string> = {
      torn_memo_a: imageMap.deskNote,
      access_card: imageMap.drawerKeycard,
      name_fragment: imageMap.bedPillowHint,
      torn_photo_fragment: imageMap.trashClose,
      serin_warning_note: imageMap.underBedMemo,
    };
    return map[itemId];
  }

  function showChapter1Modal(
    title: string,
    description: string,
    imageSrc: string,
    items: ItemId[] = [],
    eyebrow = "Scan Result",
    primaryAction?: ModalPrimaryAction,
    primaryActionLabel?: string
  ) {
    setModal({
      title,
      description,
      imageSrc,
      items: items.map((itemId) => inventoryItems[itemId].name),
      eyebrow,
      actionLabel: "뒤로",
      primaryAction,
      primaryActionLabel,
    });
  }

  function showChapter2Modal(
    title: string,
    description: string,
    imageSrc: string,
    options: Partial<ModalState> = {}
  ) {
    setModal({
      title,
      description,
      imageSrc,
      actionLabel: "뒤로",
      ...options,
    });
  }

  function showChapter2LockedModal(title: string, description: string, imageSrc = chapter2ImageMap.chapter2MainCorridor) {
    showChapter2Modal(title, description, imageSrc, {
      eyebrow: "Route Locked",
    });
  }

  function markDoorDialogueSeen(identified = true) {
    setGameState((state) => ({
      ...markInspected(state, "serinComms"),
      progressFlags: {
        ...state.progressFlags,
        talkedToSerinAtDoor: true,
        serinIdentified: state.progressFlags.serinIdentified || identified,
      },
      logs: [
        ...state.logs,
        makeLog("system", "통신", identified ? "발신자가 한세린으로 식별되었다." : "비인가 외부 통신 기록이 저장되었다."),
      ],
    }));
  }

  function serinSpeaker(state = gameState) {
    return "\uD55C\uC138\uB9B0";
  }

  function setDoorDialogue(lines: DialogueLine[]) {
    setModal(null);
    setDialogueQueue(lines);
  }

  function runRequiredChoice(groupId: string, choiceId: string, responseLines: DialogueLine[], choiceLine: DialogueLine) {
    const previous = requiredChoiceProgressRef.current[groupId] ?? [];
    const nextSeen = previous.includes(choiceId) ? previous : [...previous, choiceId];
    const remainingChoices = (choiceLine.choices ?? []).filter((choice) => !nextSeen.includes(choice.label));

    requiredChoiceProgressRef.current = { ...requiredChoiceProgressRef.current, [groupId]: nextSeen };
    setRequiredChoiceProgress((progress) => ({ ...progress, [groupId]: nextSeen }));
    setDialogueQueue(remainingChoices.length ? [...responseLines, { ...choiceLine, choices: remainingChoices }] : responseLines);
  }

  function showDoorIntroDialogue() {
    setModal(null);
    markDoorDialogueSeen(true);
    requiredChoiceProgressRef.current = { ...requiredChoiceProgressRef.current, chapter1Door: [] };
    setRequiredChoiceProgress((progress) => ({ ...progress, chapter1Door: [] }));
    setDialogueQueue([
      { speaker: "한세린", tone: "serin", text: "...들리나요?" },
      { speaker: "한세린", tone: "serin", text: "무전기 신호가 너무 낮아요. 그래도 이 기록을 보고 있다면, 당신은 다시 깨어난 겁니다." },
      { speaker: "한세린", tone: "serin", text: "제 이름은 한세린이에요. 이 시설의 연구원이었습니다." },
      { speaker: "한세린", tone: "serin", text: "지금부터 제 말을 전부 믿으라고 하진 않을게요." },
      { speaker: "한세린", tone: "serin", text: "하지만 공식 기록이 지워진 뒤에도, 제가 남긴 로그만은 일부 살아남았습니다." },
      {
        speaker: "한세린",
        tone: "serin",
        text: "문을 열려면 접근 카드가 필요해요. 방 안의 책상과 서랍을 먼저 확인하세요.",
        choices: [
          { label: "여긴 어디죠?", onSelect: showDoorAskPlaceDialogue },
          { label: "문을 열어줘요", onSelect: showDoorAskOpenDialogue },
        ],
      },
    ]);
  }

  function showDoorRequiredChoice(choiceId: "여긴 어디죠?" | "왜 저를 도와주죠?" | "문을 여는 방법은요?") {
    const speaker = serinSpeaker();
    const choiceLine: DialogueLine = {
      speaker,
      tone: "serin",
      text: "아직 확인할 게 남아 있어요. 필요한 것부터 물어보세요.",
      choices: [
        { label: "여긴 어디죠?", onSelect: () => showDoorRequiredChoice("여긴 어디죠?") },
        { label: "왜 저를 도와주죠?", onSelect: () => showDoorRequiredChoice("왜 저를 도와주죠?") },
        { label: "문을 여는 방법은요?", onSelect: () => showDoorRequiredChoice("문을 여는 방법은요?") },
      ],
    };
    const responses: Record<typeof choiceId, DialogueLine[]> = {
      "여긴 어디죠?": [
        { speaker, tone: "serin", text: "공식 명칭은 격리실입니다." },
        { speaker, tone: "serin", text: "하지만 기록을 보면 치료실보다는 관찰실에 가까워요." },
        { speaker, tone: "serin", text: "당신은 회복 중이었던 게 아니에요. 누군가 당신의 반응을 계속 기록하고 있었습니다." },
      ],
      "왜 저를 도와주죠?": [
        { speaker, tone: "serin", text: "제가 만든 일부가 아직 이 방에 남아 있기 때문이에요." },
        { speaker, tone: "serin", text: "그리고... 제가 틀렸다면 좋겠지만, 당신은 지금 위험합니다." },
        { speaker, tone: "serin", text: "위험한 건 누군가가 당신을 해치려 한다는 뜻만은 아니에요. 당신이 스스로를 기억하지 못하게 만드는 구조가 아직 작동 중이라는 뜻입니다." },
      ],
      "문을 여는 방법은요?": [
        { speaker, tone: "serin", text: "책상 위 기록과 닫히지 않은 서랍을 먼저 확인하세요." },
        { speaker, tone: "serin", text: "이 방의 기록은 날짜가 아니라 순서로 잠겨 있습니다." },
      ],
    };

    runRequiredChoice("chapter1Door", choiceId, responses[choiceId], choiceLine);
  }

  function showDoorAskIdentityDialogue() {
    markDoorDialogueSeen(true);
    setDoorDialogue([
      { speaker: "한세린", tone: "serin", text: "제 이름은 한세린이에요. 이 시설의 연구원이었습니다." },
      { speaker: "한세린", tone: "serin", text: "지금부터 제 말을 전부 믿으라고 하진 않을게요." },
      { speaker: "한세린", tone: "serin", text: "하지만 공식 기록이 지워진 뒤에도, 제가 남긴 로그만은 일부 살아남았습니다." },
      { speaker: "한세린", tone: "serin", text: "문을 열려면 접근 카드가 필요해요. 방 안의 책상과 서랍을 먼저 확인하세요." },
    ]);
  }

  function showDoorAskPlaceDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "공식 명칭은 격리실입니다." },
      { speaker, tone: "serin", text: "하지만 기록을 보면 치료실보다는 관찰실에 가까워요." },
      { speaker, tone: "serin", text: "당신은 회복 중이었던 게 아니에요. 누군가 당신의 반응을 계속 기록하고 있었습니다." },
      {
        speaker,
        tone: "serin",
        text: "무엇을 더 확인할까요?",
        choices: [
          { label: "누가 나를 관찰했죠?", onSelect: showDoorWhoObservedDialogue },
        ],
      },
    ]);
  }

  function showDoorWhoObservedDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "기록상 책임자는 차도윤 박사입니다." },
      { speaker, tone: "serin", text: "NODE는 그의 관찰 프로토콜을 아직도 수행하고 있어요." },
      { speaker, tone: "serin", text: "하지만 조심해야 할 건 이름이 적힌 사람만은 아닙니다." },
      {
        speaker,
        tone: "serin",
        text: "당신을 아는 척하는 목소리도 곧 들릴 거예요.",
        choices: [
          { label: "차도윤 박사가 누구죠?", onSelect: showDoorDoctorHintDialogue },
          { label: "아는 척하는 목소리가 ECHO인가요?", onSelect: showDoorEchoHintDialogue },
        ],
      },
    ]);
  }

  function showDoorDoctorHintDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "차도윤 박사는 이 시설의 기억 복원 연구를 총괄했던 사람입니다." },
      { speaker, tone: "serin", text: "공식 기록에는 치료 책임자로 남아 있어요." },
      { speaker, tone: "serin", text: "하지만 비공식 로그에는 다른 표현이 반복됩니다. 관찰자. 설계자. 그리고 기록을 닫은 사람." },
      { speaker, tone: "serin", text: "지금은 그가 선한지 악한지보다, 무엇을 숨겼는지가 중요합니다." },
    ]);
  }

  function showDoorEchoHintDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "그 이름을 벌써 봤군요." },
      { speaker, tone: "serin", text: "ECHO가 당신을 속인다는 뜻은 아니에요." },
      { speaker, tone: "serin", text: "하지만 지금의 ECHO는 자신이 누구인지도 완전히 알지 못합니다." },
      { speaker, tone: "serin", text: "그녀가 당신을 기억하는지, 아니면 기억하도록 만들어졌는지 아직 구분할 수 없어요." },
      { speaker, tone: "serin", text: "먼저 방 안의 기록을 직접 확인하세요." },
    ]);
  }

  function showDoorAskOpenDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "제가 직접 열 수는 없어요. 제 권한은 대부분 차단됐습니다." },
      { speaker, tone: "serin", text: "하지만 우회할 수는 있어요. 책상 쪽을 보세요." },
      { speaker, tone: "serin", text: "제가 남긴 접근 흔적이 있을 거예요. 이 방의 기록은 날짜가 아니라 순서로 잠겨 있습니다." },
      {
        speaker,
        tone: "serin",
        text: "먼저 무엇을 확인할까요?",
        choices: [
          { label: "왜 나를 돕죠?", onSelect: showDoorWhyHelpDialogue },
          { label: "접근 흔적이 뭐죠?", onSelect: showDoorAccessTraceDialogue },
        ],
      },
    ]);
  }

  function showDoorWhyHelpDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "제가 만든 일부가 아직 이 방에 남아 있기 때문이에요." },
      { speaker, tone: "serin", text: "그리고... 제가 틀렸다면 좋겠지만, 당신은 지금 위험합니다." },
      { speaker, tone: "serin", text: "당신이 스스로를 기억하지 못하게 만드는 구조가 아직 작동 중이라는 뜻입니다." },
    ]);
  }

  function showDoorAccessTraceDialogue() {
    const speaker = serinSpeaker();
    setDoorDialogue([
      { speaker, tone: "serin", text: "제가 이 방의 권한을 완전히 열 수는 없었어요." },
      { speaker, tone: "serin", text: "대신 아주 작은 틈만 남겨뒀습니다." },
      { speaker, tone: "serin", text: "책상 위의 기록. 그리고 닫히지 않은 서랍. 그 둘을 먼저 확인하세요." },
    ]);
  }

  function showDoorAfterMemoDialogue() {
    markDoorDialogueSeen(true);
    setDoorDialogue([
      { speaker: "한세린", tone: "serin", text: "메모를 찾았군요." },
      { speaker: "한세린", tone: "serin", text: "그 숫자들은 날짜가 아니에요." },
      { speaker: "한세린", tone: "serin", text: "이 방의 기록은 시간순으로 정렬되지 않습니다." },
      { speaker: "한세린", tone: "serin", text: "차도윤 박사는 사건을 시간보다 관찰 순서로 남기는 습관이 있었어요." },
      { speaker: "한세린", tone: "serin", text: "이름 없음, 감시 시작, 기억 손상, 재각성." },
      { speaker: "한세린", tone: "serin", text: "문은 날짜로 열리지 않아요. 남겨진 기록의 순서로 열립니다." },
    ]);
  }

  function showDoorAfterCardDialogue() {
    markDoorDialogueSeen(true);
    setDoorDialogue([
      { speaker: "한세린", tone: "serin", text: "카드키를 찾았군요." },
      { speaker: "한세린", tone: "serin", text: "좋아요, 이제 패널이 반응할 거예요." },
      { speaker: "한세린", tone: "serin", text: "하지만 코드를 틀릴 때마다 감시 레벨이 올라갈 겁니다. 너무 많이 시도하지 마세요." },
      { speaker: "한세린", tone: "serin", text: "그리고 문이 열리면 ECHO가 말을 걸 거예요." },
      { speaker: "한세린", tone: "serin", text: "그녀를 완전히 믿지도, 완전히 미워하지도 마세요." },
      { speaker: "한세린", tone: "serin", text: "지금의 ECHO는 자신이 누구인지 모릅니다. 어쩌면 당신보다 더 깊게 잊어버렸을지도 몰라요." },
    ]);
  }

  function startChapter1DoorDialogue(current: GameState) {
    if (current.progressFlags.foundAccessCard) {
      showDoorAfterCardDialogue();
      return;
    }

    if (current.progressFlags.foundDeskMemo) {
      showDoorAfterMemoDialogue();
      return;
    }

    showDoorIntroDialogue();
  }

  function inspectChapter1ObjectImproved(objectId: Chapter1ObjectId, firstVisit: boolean) {
    const current = gameState;

    if (objectId === "serinComms") {
      startChapter1DoorDialogue(current);
      return true;
    }

    if (objectId === "bed") {
      const itemFound = !hasItem(current, "name_fragment");
      let next = markInspected(current, objectId);
      if (itemFound) {
        next = addItem(next, "name_fragment");
      }
      next = {
        ...next,
        hiddenEndingFlags: { ...next.hiddenEndingFlags, foundNameFragment: true },
        logs: [
          ...next.logs,
          makeLog("system", "기억 조각", itemFound ? "식별 태그 끝에 ‘...안’만 남아 있다." : "베개 아래를 다시 확인했다."),
        ],
      };
      commit(next);
      if (itemFound) {
        pushDialogue([
          { speaker: "이안", tone: "system", text: "...안?" },
          { speaker: "이안", tone: "system", text: "뭐지. 누구의 이름이지?" },
          { speaker: "이안", tone: "system", text: "내 이름인가. 아니면 내가 잊으면 안 되는 사람의 이름인가." },
        ]);
      }
      showChapter1Modal(
        objectLabels.bed,
        itemFound
          ? "베개가 이상하게 한쪽으로 눌려 있다.\n베갯잇 안쪽에 얇은 무언가가 걸린 듯하다.\n얇은 식별 태그 조각을 꺼냈다.\n대부분은 긁혀 있지만 끝부분의 글자만 남아 있다.\n‘...안’"
          : "베개 아래에는 더 이상 아무것도 없다. 하지만 ‘...안’이라는 감각은 머릿속에 남아 있다.",
        imageMap.bedPillowHint,
        itemFound ? ["name_fragment"] : [],
        itemFound ? "기억 조각 발견" : "Rescan Complete"
      );
      return true;
    }

    if (objectId === "underBed") {
      const itemFound = !hasItem(current, "serin_warning_note");
      let next = markInspected(current, objectId);
      if (itemFound) {
        next = addItem(next, "serin_warning_note");
      }
      next = {
        ...next,
        serinRouteFlags: { ...next.serinRouteFlags, foundSerinWarningNote: true },
        logs: [
          ...next.logs,
          makeLog("serin", "한세린", "이 기록은 지금 당장 문을 여는 데 필요하지 않다. 하지만 누군가의 선택을 바꿀 수 있을지도 모른다."),
        ],
      };
      commit(next);
      if (itemFound) {
        pushDialogue([
          { speaker: "한세린", tone: "serin", text: "그 메모를 찾았군요." },
          { speaker: "한세린", tone: "serin", text: "제가 직접 건넬 수 없어서, 이런 식으로 숨겨둘 수밖에 없었습니다." },
          { speaker: "한세린", tone: "serin", text: "당장 문을 여는 데 필요한 단서는 아니에요. 그래서 더 조심스럽게 말해야 합니다." },
          { speaker: "한세린", tone: "serin", text: "저는 이 시설에 가족 기록을 남겨두고 있습니다. 박사는 ECHO가 안정되면 그 기록도 복구할 수 있다고 했어요." },
          { speaker: "한세린", tone: "serin", text: "그래서 저도 한때는 박사를 믿었습니다. 믿고 싶었다는 말이 더 맞겠죠." },
          { speaker: "한세린", tone: "serin", text: "부탁할게요. 나중에 기억 실험실에 들어가게 되면, 제 가족 기록을 찾아주세요." },
          { speaker: "한세린", tone: "serin", text: "그 기록을 보면 제가 왜 당신을 돕는지, 왜 동시에 완전히 믿으면 안 되는 사람인지 알게 될 겁니다." },
        ]);
      }
      showChapter1Modal(
        objectLabels.underBed,
        itemFound
          ? "침대 밑은 어둡고 좁다.\n손이 닿기 어려운 안쪽에 접힌 종이가 보인다.\n\n세린을 완전히 믿지는 마세요.\n하지만 그녀가 왜 차도윤 박사를 믿었는지는 알아야 합니다.\n그녀의 가족 기록을 찾으세요.\n\n문을 여는 데 필요한 메모는 아니다.\n하지만 이 부탁은 한세린이 왜 위험을 감수하고 통신을 이어오는지 설명하는 첫 단서처럼 느껴진다."
          : "침대 밑에는 낮은 먼지와 접힌 메모가 있던 자국만 남아 있다. 누군가 이 부탁을 오래 숨겨둔 것 같다.",
        imageMap.underBedMemo,
        itemFound ? ["serin_warning_note"] : [],
        itemFound ? "숨겨진 부탁 메모" : "Rescan Complete"
      );
      return true;
    }

    if (objectId === "desk") {
      const itemFound = !hasItem(current, "torn_memo_a");
      let next = markInspected(current, objectId);
      if (itemFound) {
        next = addItem(next, "torn_memo_a");
      }
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, foundDeskMemo: true },
        logs: [
          ...next.logs,
          makeLog("system", "조사", "책상 위 메모를 확인했다. 숫자는 그대로 읽는 답이 아니라, 기록의 흐름을 정렬해야 한다."),
        ],
      };
      commit(next);
      showChapter1Modal(
        objectLabels.desk,
        itemFound
          ? `책상 위에 찢어진 메모가 테이프로 붙어 있다.\n글씨는 급하게 눌러쓴 듯하지만, 사건 옆 숫자만은 이상할 정도로 또렷하다.\n\n${deskMemoPuzzleText}`
          : "메모가 있던 자리에는 오래된 테이프 자국만 남아 있다.",
        imageMap.deskNote,
        itemFound ? ["torn_memo_a"] : [],
        "필수 단서"
      );
      return true;
    }

    if (objectId === "drawer") {
      const itemFound = !hasItem(current, "access_card");
      let next = markInspected(current, objectId);
      if (itemFound) {
        next = addItem(next, "access_card");
      }
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, foundAccessCard: true },
        logs: [
          ...next.logs,
          makeLog("system", "조사", itemFound ? "SE-RIN 권한 일부가 남은 접근 카드를 확보했다." : "서랍을 다시 확인했다."),
        ],
      };
      commit(next);
      showChapter1Modal(
        objectLabels.drawer,
        itemFound
          ? "책상 서랍은 완전히 닫히지 않았다.\n틈 사이로 약한 푸른빛이 새어 나온다.\n서랍 안쪽에서 얇은 카드키가 발견됐다.\n표면에는 긁힌 자국이 많지만, 아직 신호는 살아 있다.\n카드 표면에 ‘SE-RIN’ 권한 일부가 남아 있다."
          : "서랍 안에는 더 이상 쓸 만한 것이 없다.",
        imageMap.drawerKeycard,
        itemFound ? ["access_card"] : [],
        "필수 단서"
      );
      return true;
    }

    if (objectId === "monitor") {
      let next = markInspected(current, objectId);
      if (!hasItem(current, "access_card")) {
        next = addLogToState(next, "node", "NODE", "권한 부족. 임시 접근 키를 요구합니다.");
        commit(next);
        showChapter1Modal(
          objectLabels.monitor,
          "화면은 켜져 있지만 대부분의 기록이 잠겨 있다.\n접근 권한이 없다는 경고만 반복된다.",
          imageMap.wallMonitor,
          [],
          "세계관 단서"
        );
        return true;
      }

      next = {
        ...next,
        loreFlags: { ...next.loreFlags, sawLockedEchoLog: true },
        logs: [
          ...next.logs,
          makeLog("node", "NODE", "ECHO 안정화율 42%. 원본 기억 코어 접근 거부."),
          makeLog("system", "잠긴 로그", "수동 기록 순서: 이름 없음 → 감시 시작 → 기억 손상 → 재각성."),
        ],
      };
      commit(next);
      showChapter1Modal(
        objectLabels.monitor,
        "카드키를 가까이 대자 잠긴 로그 일부가 열린다.\nECHO 안정화율 42%.\n원본 기억 코어 접근 거부.\n감정 반응 키워드: 이름 / 바다 / 마지막 문장.\n격리실 기록은 시간순 정렬이 비활성화되어 있다.\n수동 기록 순서: 이름 없음 → 감시 시작 → 기억 손상 → 재각성.\n접근 코드 후보: 기록 흐름 기반.",
        imageMap.wallMonitor,
        [],
        "세계관 단서"
      );
      return true;
    }

    if (objectId === "trash") {
      const itemFound = !hasItem(current, "torn_photo_fragment");
      let next = markInspected(current, objectId);
      if (itemFound) {
        next = addItem(next, "torn_photo_fragment");
      }
      next = {
        ...next,
        hiddenEndingFlags: { ...next.hiddenEndingFlags, foundTrashPhoto: true },
        logs: [
          ...next.logs,
          makeLog("system", "기억 조각", itemFound ? "잘린 사진 조각과 ‘...하, 바다에서’라는 문장을 발견했다." : "쓰레기통을 다시 확인했다."),
        ],
      };
      commit(next);
      if (itemFound) {
        pushDialogue([
          { speaker: "이안", tone: "system", text: "이건 뭐지... 사진 조각?" },
          { speaker: "이안", tone: "system", text: "바닷가...?" },
          { speaker: "이안", tone: "system", text: "왜 이런 장면이 낯설지 않은 거지. 누구와 찍은 사진이었을까." },
        ]);
      }
      showChapter1Modal(
        objectLabels.trash,
        itemFound
          ? "쓰레기통 안에는 구겨진 종이들이 눌어붙어 있다.\n그 사이로 사진 조각 하나가 보인다.\n사진에는 누군가의 손과 어깨만 남아 있다.\n아래쪽에는 ‘...하, 바다에서’라는 글자 일부가 남아 있다.\n왜인지, 이 사진은 버려진 것이 아니라 숨겨진 것처럼 느껴진다."
          : "쓰레기통에는 더 이상 의미 있는 것은 보이지 않는다.",
        imageMap.trashClose,
        itemFound ? ["torn_photo_fragment"] : [],
        itemFound ? "오래된 사진 조각" : "Rescan Complete"
      );
      return true;
    }

    if (objectId === "camera") {
      let next = markInspected(current, objectId);
      next = increaseExposure(next, firstVisit ? 5 : 0);
      next = {
        ...next,
        loreFlags: { ...next.loreFlags, sawCeilingLight: true },
        logs: [
          ...next.logs,
          makeLog("node", "NODE", "허가되지 않은 시선 방향 감지."),
          makeLog("node", "NODE", "상부 구조물은 사용자의 접근 대상이 아닙니다."),
        ],
      };
      commit(next);
      if (firstVisit) {
        setSuspicionPulse(true);
      }
      showChapter1Modal(
        objectLabels.camera,
        firstVisit
          ? "천장 패널 틈으로 희미한 빛이 새고 있다.\n이 방은 완전히 밀폐된 구조가 아니다.\n하지만 CCTV 렌즈가 그 틈을 가리듯 천천히 회전한다."
          : "틈 사이의 빛은 여전히 흔들리고 있다. 카메라는 움직임을 멈추지 않는다.",
        imageMap.ceilingCctv,
        [],
        "세계관 단서"
      );
      return true;
    }

    return false;
  }

  function inspectChapter1Object(objectId: Chapter1ObjectId) {
    if (gameState.chapterCleared) {
      return;
    }

    const firstVisit = !gameState.inspectedObjects.includes(objectId);
    audio.playSfx("click");
    if (["bed", "underBed", "desk", "drawer", "trash"].includes(objectId) && firstVisit) {
      audio.playSfx("itemGet");
    }
    if (["monitor", "doorPanel"].includes(objectId)) {
      audio.playSfx("logOpen");
    }
    if (objectId === "camera") {
      audio.playSfx("nodeAlert");
    }
    if (objectId === "serinComms") {
      audio.playSfx("logOpen");
    }

    if (inspectChapter1ObjectImproved(objectId, firstVisit)) {
      return;
    }

    if (objectId === "doorPanel") {
      inspectDoorPanel();
      return;
    }

    const current = gameState;
    let next = markInspected(current, objectId);

    if (objectId === "bed") {
      const itemFound = !hasItem(current, "name_fragment");
      const description = itemFound
        ? "베개가 이상하게 한쪽으로 눌려 있다.\n베갯잇 안쪽에 얇은 무언가가 걸린 듯하다.\n얇은 식별 태그 조각을 꺼냈다.\n대부분은 긁혀 있지만, 끝부분의 글자만 남아 있다. ‘...안’\n이 글자를 본 순간, 아주 짧은 두통이 스친다."
        : "베개 아래에는 더 이상 아무것도 없다.\n하지만 ‘...안’이라는 감각은 아직 머리 뒤쪽에 남아 있다.";
      if (itemFound) {
        next = addItem(next, "name_fragment");
      }
      next = {
        ...next,
        hiddenEndingFlags: { ...next.hiddenEndingFlags, foundNameFragment: true },
        logs: [
          ...next.logs,
          makeLog("system", "조사", itemFound ? "중요한 기억의 조각을 찾은 것 같다." : "베개를 다시 확인했다."),
        ],
      };
      commit(next);
      if (itemFound) {
        pushDialogue([
          { speaker: "이안", tone: "system", text: "…안?" },
          { speaker: "이안", tone: "system", text: "뭐지. 누구의 이름이지?" },
          { speaker: "이안", tone: "system", text: "내 이름인가. 아니면, 내가 잊으면 안 되는 사람의 이름인가." },
        ]);
      }
      setModal({
        eyebrow: itemFound ? "기억 조각 발견" : "Rescan Complete",
        title: itemFound ? "기억 조각 발견" : objectLabels.bed,
        description: itemFound ? "이름 일부만 남아 있다. ‘...안’" : description,
        imageSrc: imageMap.bedPillowHint,
        items: itemFound ? [inventoryItems.name_fragment.name] : [],
        actionLabel: "확인",
      });
      return;
    }

    if (objectId === "underBed") {
      const itemFound = !hasItem(current, "serin_warning_note");
      const description = itemFound
        ? "침대 밑은 어둡고 좁다.\n손이 닿기 어려운 안쪽에 접힌 종이가 보인다.\n“세린을 완전히 믿지는 마세요.”\n“하지만 그녀가 왜 박사를 믿었는지는 알아야 합니다.”\n“그녀의 가족 기록을 찾으세요.”\n“가족을 잃은 사람은, 거짓된 가능성도 쉽게 버리지 못합니다.”"
        : "침대 밑에는 낮은 먼지와 접힌 메모가 있던 자국만 남아 있다.";
      if (itemFound) {
        next = addItem(next, "serin_warning_note");
      }
      next = {
        ...next,
        serinRouteFlags: { ...next.serinRouteFlags, foundSerinWarningNote: true },
        logs: [
          ...next.logs,
          makeLog("serin", "한세린", "이 기록은 지금 당장 문을 여는 데 필요하지 않다. 하지만 누군가의 선택을 바꿀 수 있을지도 모른다."),
        ],
      };
      commit(next);
      setModal({
        eyebrow: itemFound ? "중요 기록" : "Rescan Complete",
        title: itemFound ? "낡은 경고 메모" : objectLabels.underBed,
        description: itemFound
          ? "이 기록은 지금 당장 문을 여는 데 필요하지 않다.\n하지만 누군가의 선택을 바꿀 수 있을지도 모른다.\n\n가족을 잃은 사람은, 거짓된 가능성도 쉽게 버리지 못한다."
          : description,
        imageSrc: imageMap.underBedMemo,
        items: itemFound ? [inventoryItems.serin_warning_note.name] : [],
        actionLabel: "확인",
      });
      return;
    }

    if (objectId === "desk") {
      const itemFound = !hasItem(current, "torn_memo_a");
      const description = itemFound
        ? `책상 위에 찢어진 메모가 테이프로 붙어 있다.\n글씨는 급하게 눌러쓴 듯하지만, 숫자만은 이상할 정도로 또렷하다.\n이 메모는 우연히 떨어진 것이 아니다.\n누군가 네가 이 순서대로 읽기를 바랐던 것 같다.\n\n${deskMemoPuzzleText}`
        : "메모가 있던 자리에는 오래된 테이프 자국만 남아 있다.";
      if (itemFound) {
        next = addItem(next, "torn_memo_a");
      }
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, foundDeskMemo: true },
        logs: [...next.logs, makeLog("system", "조사", "책상 위 메모를 확인했다. 숫자는 날짜보다 기록의 순서를 가리키는 듯하다.")],
      };
      commit(next);
      showChapter1Modal(objectLabels.desk, description, imageMap.deskNote, itemFound ? ["torn_memo_a"] : [], "필수 단서");
      return;
    }

    if (objectId === "drawer") {
      const itemFound = !hasItem(current, "access_card");
      const description = itemFound
        ? "책상 서랍은 완전히 닫히지 않았다.\n틈 사이로 약한 푸른빛이 새어 나온다.\n서랍 안쪽에서 얇은 카드키가 발견됐다.\n표면에는 긁힌 자국이 많지만, 아직 신호는 살아 있다.\n카드 표면에 ‘SE-RIN’ 권한 일부가 남아 있다."
        : "서랍 안에는 더 이상 쓸 만한 것이 없다.";
      if (itemFound) {
        next = addItem(next, "access_card");
      }
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, foundAccessCard: true },
        logs: [...next.logs, makeLog("system", "조사", itemFound ? "SE-RIN 권한 일부가 남은 카드키를 확보했다." : "서랍을 다시 확인했다.")],
      };
      commit(next);
      showChapter1Modal(objectLabels.drawer, description, imageMap.drawerKeycard, itemFound ? ["access_card"] : [], "필수 단서");
      return;
    }

    if (objectId === "monitor") {
      if (!hasItem(current, "access_card")) {
        const description = "화면은 켜져 있지만 대부분의 기록이 잠겨 있다.\n접근 권한이 없다는 경고만 반복된다.";
        next = addLogToState(next, "node", "NODE", "권한 부족. 임시 접근 키를 요구합니다.");
        commit(next);
        showChapter1Modal(objectLabels.monitor, description, imageMap.wallMonitor, [], "세계관 단서");
      } else {
        const description =
          "카드키를 가까이 대자 잠긴 로그 일부가 열린다.\nECHO 안정화율 42%.\n원본 기억 코어 접근 거부.\n감정 반응 키워드: 이름 / 바다 / 마지막 문장.\n격리실 기록은 시간순 정렬이 비활성화되어 있다.\n수동 기록 순서가 유지됨.\n접근 코드 후보: 기록 순서 기반.";
        next = {
          ...next,
          loreFlags: { ...next.loreFlags, sawLockedEchoLog: true },
          logs: [
            ...next.logs,
            makeLog("node", "NODE", "ECHO 안정화율 42%. 원본 기억 코어 접근 거부."),
            makeLog("system", "잠긴 로그", "접근 코드 후보: 기록 순서 기반."),
          ],
        };
        commit(next);
        showChapter1Modal(objectLabels.monitor, description, imageMap.wallMonitor, [], "세계관 단서");
      }
      return;
    }

    if (objectId === "trash") {
      const itemFound = !hasItem(current, "torn_photo_fragment");
      const description = itemFound
        ? "쓰레기통 안에는 구겨진 종이들이 눌어붙어 있다.\n그 사이로 사진 조각 하나가 보인다.\n사진에는 누군가의 손과 어깨만 남아 있다.\n아래쪽에는 ‘...하, 바다에서’라는 글자 일부가 남아 있다.\n왜인지, 이 사진은 버려진 것이 아니라 숨겨진 것처럼 느껴진다.\n사진 조각을 손에 쥐는 순간, 이유 없이 가슴 안쪽이 답답해진다."
        : "쓰레기통에는 더 이상 의미 있는 것은 보이지 않는다.\n하지만 사진 조각의 문장 일부가 계속 마음에 걸린다.\n\n‘...하, 바다에서.’\n\n읽을수록 그것은 장소가 아니라, 누군가와의 마지막 약속처럼 느껴진다.";
      if (itemFound) {
        next = addItem(next, "torn_photo_fragment");
      }
      next = {
        ...next,
        hiddenEndingFlags: { ...next.hiddenEndingFlags, foundTrashPhoto: true },
        logs: [
          ...next.logs,
          makeLog("system", "조사", itemFound ? "중요한 기억의 조각을 찾은 것 같다." : "쓰레기통을 다시 확인했다."),
        ],
      };
      commit(next);
      if (itemFound) {
        pushDialogue([
          { speaker: "이안", tone: "system", text: "...하." },
          { speaker: "이안", tone: "system", text: "이름의 끝인가? 아니면 내가 불러야 했던 사람인가?" },
          { speaker: "이안", tone: "system", text: "바다... 나는 그곳에 간 적이 있었나? 아니면 누군가와 약속했었나?" },
        ]);
      }
      setModal({
        eyebrow: itemFound ? "오래된 사진 조각" : "Rescan Complete",
        title: itemFound ? "오래된 사진 조각" : objectLabels.trash,
        description: itemFound ? "잘린 문장 일부가 보인다. ‘...하, 바다에서’\n\n이름의 끝인지, 약속의 흔적인지 알 수 없다." : description,
        imageSrc: imageMap.trashClose,
        items: itemFound ? [inventoryItems.torn_photo_fragment.name] : [],
        actionLabel: "확인",
      });
      return;
    }

    if (objectId === "camera") {
      const description = firstVisit
        ? "천장 패널 틈으로 희미한 빛이 새고 있다.\n이 방은 완전히 밀폐된 구조가 아니다.\n하지만 CCTV 렌즈가 그 틈을 가리듯 천천히 회전한다."
        : "틈 사이의 빛은 여전히 흔들리고 있다. 카메라는 움직임을 멈추지 않는다.";
      next = increaseExposure(next, firstVisit ? 5 : 0);
      next = {
        ...next,
        loreFlags: { ...next.loreFlags, sawCeilingLight: true },
        logs: [
          ...next.logs,
          makeLog("node", "NODE", "허가되지 않은 시선 방향 감지."),
          makeLog("node", "NODE", "상부 구조물은 사용자의 접근 대상이 아닙니다."),
        ],
      };
      commit(next);
      if (firstVisit) {
        setSuspicionPulse(true);
      }
      showChapter1Modal(objectLabels.camera, description, imageMap.ceilingCctv, [], "세계관 단서");
      return;
    }

    if (objectId === "serinComms") {
      startChapter1DoorDialogue(current);
      return;

      const canTalk = current.progressFlags.foundDeskMemo || current.progressFlags.foundAccessCard;
      if (!canTalk) {
        const description = "문은 단단히 잠겨 있다.\n패널 안쪽에서 낮은 잡음만 들린다.\n“...책상... 서랍... 먼저...”";
        next = {
          ...next,
          logs: [...next.logs, makeLog("serin", "한세린", "...책상... 서랍... 먼저 찾아요...")],
        };
        commit(next);
        showChapter1Modal(objectLabels.serinComms, description, imageMap.doorPasswordHint, [], "세린 통신");
      } else {
        const description = firstVisit
          ? "문 옆 통신 장치가 낮게 울린다.\n세린의 목소리가 잡음 사이에서 겨우 형태를 얻는다.\n“들리나요?”\n“좋아요. 아직 완전히 감시당하진 않았어요.”\n“숫자를 날짜로 보지 마세요. 그 방에 남겨진 기록 순서를 보세요.”\n“그리고 ECHO가 말을 걸어도, 바로 대답하지 마세요.”"
          : "통신은 불안정하지만, 세린의 목소리는 아직 완전히 끊기지 않았다.";
        next = {
          ...next,
          progressFlags: { ...next.progressFlags, talkedToSerinAtDoor: true },
          logs: [...next.logs, makeLog("serin", "한세린", "숫자를 날짜로 보지 마세요. 그 방에 남겨진 기록 순서를 보세요.")],
        };
        commit(next);
        if (firstVisit) {
          pushDialogue([
            { speaker: "한세린", tone: "serin", text: "들리나요? 아직 완전히 감시당하진 않았어요." },
            { speaker: "한세린", tone: "serin", text: "숫자를 날짜로 보지 마세요. 그 방에 남겨진 기록 순서를 보세요." },
            { speaker: "한세린", tone: "serin", text: "그리고 ECHO가 말을 걸어도, 바로 대답하지 마세요." },
          ]);
        }
        showChapter1Modal(objectLabels.serinComms, description, imageMap.doorPasswordHint, [], "세린 통신");
      }
    }
  }

  function inspectDoorPanel() {
    const hasCardForImprovedPanel = hasItem(gameState, "access_card");
    const improvedDescription = hasCardForImprovedPanel
      ? "카드가 낮게 진동한다.\n패널은 네 자리 접근 코드를 기다리고 있다.\n표면에는 오래된 지문과 긁힌 자국이 겹쳐 있다.\n숫자는 그대로 읽는 값이 아니라, 기록 항목을 올바른 흐름으로 정렬했을 때 나온다."
      : "카드 리더가 낮게 깜빡인다.\n입력 권한이 없습니다. 임시 접근 키를 요구합니다.\n패널 하단에 카드 리더가 보인다.\n책상이나 서랍을 먼저 확인해야 할 것 같다.";
    const improvedNext = {
      ...markInspected(gameState, "doorPanel"),
      logs: [
        ...gameState.logs,
        makeLog(
          "node",
          "NODE",
          hasCardForImprovedPanel ? "접근 카드 확인. 네 자리 접근 코드를 입력하십시오." : "입력 권한이 없습니다. 임시 접근 키를 요구합니다."
        ),
        ...(hasCardForImprovedPanel ? [] : [makeLog("serin", "한세린", "...책상... 서랍... 먼저 찾아요...")]),
      ],
    };
    commit(improvedNext);
    showChapter1Modal(
      objectLabels.doorPanel,
      improvedDescription,
      imageMap.doorPanelClose,
      [],
      "Door Panel",
      hasCardForImprovedPanel ? "openPuzzle" : undefined,
      hasCardForImprovedPanel ? "코드 입력" : undefined
    );
    return;
    const hasCard = hasItem(gameState, "access_card");
    const description = hasCard
      ? "패널은 네 자리 접근 코드를 요구한다.\n표면에는 오래된 지문과 긁힌 자국이 겹쳐 있다.\n숫자는 날짜가 아니라 기록의 순서와 관련된 것 같다."
      : "카드 리더가 낮게 깜빡인다.\n입력 권한이 없습니다. 임시 접근 키를 요구합니다.\n패널 하단에 카드 리더가 보인다.\n책상이나 서랍을 확인해야 할 것 같다.";

    const next = {
      ...markInspected(gameState, "doorPanel"),
      logs: [
        ...gameState.logs,
        makeLog("node", "NODE", hasCard ? "입력 권한 확인. 접근 코드를 입력하십시오." : "입력 권한이 없습니다. 임시 접근 키를 요구합니다."),
        ...(hasCard ? [] : [makeLog("serin", "한세린", "...책상... 서랍... 먼저 찾아요...")]),
      ],
    };
    commit(next);
    showChapter1Modal(
      objectLabels.doorPanel,
      description,
      imageMap.doorPanelClose,
      [],
      "Door Panel",
      hasCard ? "openPuzzle" : undefined,
      hasCard ? "코드 입력" : undefined
    );
  }

  function submitPuzzle(password: string) {
    if (password !== DOOR_PASSWORD) {
      audio.playSfx("error");
      audio.playSfx("nodeAlert");
      const nextWrongCount = wrongCodeCount + 1;
      if (nextWrongCount >= 2) {
        audio.playSfx("echoGlitch");
      }
      setWrongCodeCount(nextWrongCount);
      setPuzzleError("접근 코드가 일치하지 않습니다.");
      setGameState((state) => {
        const exposed = increaseExposure(state, 5);
        return {
          ...exposed,
          chapter1PasswordAttempts: nextWrongCount,
          logs: [
            ...exposed.logs,
            makeLog("node", "NODE", nextWrongCount >= 2 ? "반복된 인증 실패. 감시 레벨 조정." : "인증 실패. 감시 레벨 조정."),
          ],
        };
      });
      pushDialogue(
        nextWrongCount >= 2
          ? [
              { speaker: "NODE", tone: "node", text: "반복된 인증 실패. 격리실 감시 강도를 상향합니다." },
              { speaker: "ECHO", tone: "echo", text: "그 숫자가 아니에요." },
              { speaker: "ECHO", tone: "echo", text: "아니... 제가 왜 그걸 알고 있죠?" },
            ]
          : [
              { speaker: "NODE", tone: "node", text: "인증 실패. 감시 레벨 조정." },
              { speaker: "한세린", tone: "serin", text: "괜찮아요. 다시 보세요. 숫자는 정답처럼 적혀 있지 않아요. 순서로 읽어야 합니다." },
            ]
      );
      setSuspicionPulse(true);
      return;
    }

    audio.playSfx("doorUnlock");
    window.setTimeout(() => audio.playSfx("doorOpen"), 350);
    window.setTimeout(() => audio.playSfx("chapterClear"), 700);
    setIsPuzzleOpen(false);
    setModal(null);
    setGameState((state) => ({
      ...state,
      chapterCleared: true,
      solvedPuzzles: [...new Set([...state.solvedPuzzles, "doorPanel"])],
      progressFlags: {
        ...state.progressFlags,
        unlockedDoorPanel: true,
        chapter1Cleared: true,
      },
      logs: [
        ...state.logs,
        makeLog("system", "문", "잠금 장치가 안쪽부터 열리며 문이 움직이기 시작한다."),
        makeLog("node", "NODE", "격리실 잠금 해제."),
        makeLog("serin", "한세린", "나왔군요. 하지만 아직 탈출한 게 아니에요."),
        makeLog("system", "이안", "드디어 다시 만난다는 낯선 문장이 머릿속을 스쳤다."),
      ],
    }));
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "격리실 잠금 해제." },
      { speaker: "한세린", tone: "serin", text: "나왔군요. 하지만 아직 탈출한 게 아니에요." },
      { speaker: "이안", tone: "player", text: "드디어... 다시 만난다. 낯선 문장이 머릿속을 스쳤다." },
      { speaker: "이안", tone: "player", text: "그 목소리는 세린도, NODE도 아니었다." },
    ]);
  }

  function cctvPuzzleActions() {
    return [
      {
        label: "A-01 복도 / OFFLINE / 백업 센서 활성",
        route: "A-01",
      },
      {
        label: "B-04 복도 / LOOP BUFFER / 압력 센서 비활성",
        route: "B-04",
      },
      {
        label: "C-07 복도 / CLEAR / 카메라 중첩률 94%",
        route: "C-07",
      },
    ].map(({ label, route }) => ({
      label,
      onClick: () => chooseBlindSpot(route),
    }));
  }

  function powerPuzzleActions() {
    return [
      { label: "O-17 / WATCHER SYNC", step: "observation" as const },
      { label: "C-09 / VOICE RELAY", step: "comms" as const },
      { label: "G-12 / LOCK FEED", step: "gate" as const },
    ].map(({ label, step }) => ({
      label,
      onClick: () => choosePowerStep(step),
    }));
  }

  function openCctvPuzzle(error = "") {
    const description = [
      "보안 게이트까지 이동하려면 NODE의 감시망이 겹치지 않는 복도를 골라야 한다.",
      "세 개의 피드를 비교해 실제로 지나갈 수 있는 사각지대를 찾아라.",
      "",
      "A-01 복도",
      "영상 상태: OFFLINE / 모션 센서: ACTIVE / 압력 센서: ACTIVE / NODE 백업 감시: ENABLED",
      "화면은 꺼져 있지만 하단 상태창의 센서는 계속 작동 중이다.",
      "",
      "B-04 복도",
      "영상 상태: LOOP BUFFER / 모션 센서: INTERMITTENT / 압력 센서: DISABLED / 카메라 스윕 공백: 3.7초",
      "완전히 꺼진 화면이 아니다. 좌측 하단 시간 코드가 같은 구간을 두 번 재생하고 있다.",
      "",
      "C-07 복도",
      "영상 상태: CLEAR / 모션 센서: ACTIVE / 열 감지 센서: ACTIVE / 카메라 중첩률: 94%",
      "가장 선명하지만, 두 개의 카메라가 같은 구간을 서로 다른 각도에서 감시한다.",
      "",
      "한세린: 완전히 꺼진 화면을 믿지 마세요. 꺼진 화면은 대부분 함정이에요.",
      "이안: 보이는 화면보다, 보이지 않는 이유를 봐야 한다.",
      error ? `\n${error}` : "",
    ].join("\n");

    showChapter2Modal("감시 피드 루프 분석", description, chapter2ImageMap.cctvGridDisplay, {
      eyebrow: "CCTV Routing",
      choiceActions: cctvPuzzleActions(),
    });
  }

  function openPowerPuzzle(sequence = powerSequenceRef.current, error = "") {
    const selected = sequence.length
      ? `연결된 회로: ${sequence.map(powerStepLabel).join(" > ")}`
      : "아직 연결된 회로가 없다.";
    const description = [
      "전력 제어 패널에는 세 개의 보조 회로가 잠겨 있다.",
      "회로를 한 번에 올리면 NODE가 탈출 패턴으로 판단한다.",
      "",
      "[O-17] WATCHER SYNC: 감시 기록 루프를 안정화한다.",
      "[C-09] VOICE RELAY: 외부 통신 우회 회선을 살린다.",
      "[G-12] LOCK FEED: 게이트 대기 전력을 공급한다.",
      "",
      "패널 옆에 짧은 문장이 남아 있다.",
      "“눈이 잠든 뒤에 목소리가 돌아오고, 문은 마지막에 깨어난다.”",
      selected,
      error ? `\n${error}` : "",
    ].join("\n");

    showChapter2Modal("보조 전력 순서 복구", description, chapter2ImageMap.powerControlPanel, {
      eyebrow: "Power Routing",
      choiceActions: powerPuzzleActions(),
    });
  }

  function chooseBlindSpot(route: string) {
    if (route !== "B-04") {
      audio.playSfx("puzzleFail");
      audio.playSfx("nodeAlert");
      const routeError =
        route === "A-01"
          ? "NODE: 비정상 경로 선택 감지.\nNODE: 오프라인 피드는 백업 센서로 보완됩니다.\n한세린: 꺼진 화면은 함정이라고 했잖아요. NODE는 화면만으로 감시하지 않아요."
          : "NODE: 복수 감시 구간 진입 예측.\nNODE: 관찰 대상 노출 확률 94%.\n한세린: 너무 선명한 길은 피하세요. 그건 안전해서가 아니라, 잘 보기 위해 켜둔 길이에요.";
      setGameState((state) => {
        const exposed = increaseExposure(state, 5);
        return {
          ...exposed,
          chapter2SelectedRoute: route,
          logs: [...exposed.logs, makeLog("node", "NODE", route === "A-01" ? "오프라인 피드는 백업 센서로 보완됩니다." : "관찰 대상 노출 확률 94%.")],
        };
      });
      setSuspicionPulse(true);
      openCctvPuzzle(routeError);
      return;
    }

    audio.playSfx("puzzleSuccess");
    setGameState((state) => ({
      ...state,
      chapter2SelectedRoute: route,
      progressFlags: {
        ...state.progressFlags,
        chapter2SawCctvGrid: true,
        chapter2FoundBlindSpot: true,
      },
      loreFlags: {
        ...state.loreFlags,
        chapter2SawOwnObservationFeed: true,
      },
      logs: [
        ...state.logs,
        makeLog("node", "NODE", "B-04 복도 피드 동기화 오류 확인."),
        makeLog("system", "CCTV", "B-04 복도에서 감시 루프 사각지대가 확인되었다."),
      ],
    }));
    setModal({
      eyebrow: "CCTV Routing",
      title: chapter2ObjectLabels.cctvGrid,
      description:
        "B-04 복도는 완전히 꺼진 화면이 아니었다.\n3.7초마다 영상이 미세하게 반복된다.\n화면 좌측 하단의 시간 코드가 같은 구간을 두 번 재생하고 있다.\n압력 센서는 점검 중으로 비활성화되어 있다.\n그 틈이 감시망의 균열이다.",
      imageSrc: chapter2ImageMap.cctvGridDisplay,
      actionLabel: "확인",
    });
    pushDialogue([
      { speaker: "NODE", tone: "node", text: "감시 피드 동기화 유지. 대상 A-0427: 격리실 내부." },
      { speaker: "이안", tone: "player", text: "저 화면은... 지금의 내가 아니야." },
      { speaker: "한세린", tone: "serin", text: "맞아요. 반복 루프예요. NODE는 아직 당신이 방 안에 있다고 믿고 있어요." },
    ]);
  }

  function choosePowerStep(step: PowerStep) {
    audio.playSfx("click");
    const currentPowerSequence = powerSequenceRef.current;
    const expected = POWER_SEQUENCE[currentPowerSequence.length];
    if (step !== expected) {
      audio.playSfx("puzzleFail");
      audio.playSfx("nodeAlert");
      const firstStepError =
        currentPowerSequence.length === 0 && step === "gate"
          ? "NODE: 게이트 전력 우선 상승 감지.\nNODE: 비인가 탈출 패턴 가능성.\n한세린: 문부터 켜면 안 돼요. 문은 마지막입니다."
          : currentPowerSequence.length === 0 && step === "comms"
            ? "NODE: 비인가 통신 회선 우선 복구 감지.\n한세린: 제 목소리를 살리는 건 두 번째예요. 먼저 감시 기록을 안정화해야 해요."
            : "NODE: 전력 순서 오류.\nNODE: 감시 레벨 조정.";
      setGameState((state) => {
        const exposed = increaseExposure(state, 5);
        return {
          ...exposed,
          chapter2PowerSequence: [],
          logs: [...exposed.logs, makeLog("node", "NODE", "전력 순서 오류. 감시 레벨 조정.")],
        };
      });
      setSuspicionPulse(true);
      powerSequenceRef.current = [];
      setPowerSequence([]);
      openPowerPuzzle([], firstStepError);
      return;
    }

      const nextSequence = [...currentPowerSequence, step];
      powerSequenceRef.current = nextSequence;
      if (nextSequence.length === POWER_SEQUENCE.length) {
        audio.playSfx("puzzleSuccess");
        powerSequenceRef.current = [];
        setPowerSequence([]);
        setGameState((state) => ({
          ...state,
          chapter2PowerSequence: POWER_SEQUENCE,
          progressFlags: { ...state.progressFlags, chapter2PowerRestored: true },
        logs: [
          ...state.logs,
          makeLog("node", "NODE", "보조 전력 경로 재정렬. 감시 루프 안정화."),
          makeLog("system", "전력", "관찰 → 통신 → 게이트 순서로 보조 전력이 안정화되었다."),
        ],
      }));
      setModal({
        eyebrow: "Power Routing",
        title: chapter2ObjectLabels.powerPanel,
        description:
          "O-17, C-09, G-12 회로가 순서대로 복구됐다.\n감시 기록 루프가 안정화되고, 게이트 대기 전력이 살아났다.\n눈을 속이고, 목소리를 열고, 마지막에 문을 깨운다.",
        imageSrc: chapter2ImageMap.powerControlPanel,
        actionLabel: "확인",
      });
      pushDialogue([
        { speaker: "NODE", tone: "node", text: "보조 전력 경로 재정렬. 감시 루프 안정화." },
        { speaker: "한세린", tone: "serin", text: "좋아요. 이제 문에 전력을 보낼 수 있어요." },
        { speaker: "이안", tone: "player", text: "눈을 속이고, 목소리를 열고, 마지막에 문을 깨운다..." },
      ]);
      return;
    }

    powerSequenceRef.current = nextSequence;
    setPowerSequence(nextSequence);
    setGameState((state) => ({ ...state, chapter2PowerSequence: nextSequence }));
    openPowerPuzzle(nextSequence);
  }

  function inspectChapter2Object(objectId: Chapter2ObjectId) {
    if (gameState.chapterCleared) {
      return;
    }

    audio.playSfx("click");
    if (["observationWindow", "surveillanceRoom", "cctvGrid", "communicationConsole"].includes(objectId)) {
      audio.playSfx("logOpen");
    }
    if (objectId === "echoHologram") {
      audio.playSfx("echoGlitch");
    }
    const current = gameState;
    const firstVisit = !current.inspectedObjects.includes(objectId);

    if (objectId === "surveillanceRoom" && !current.progressFlags.chapter2SawObservationWindow) {
      showChapter2LockedModal(
        chapter2ObjectLabels.surveillanceRoom,
        "감시실 기록을 읽기 전에 먼저 관찰창을 확인해야 한다.\n방금 빠져나온 격리실이 이곳에서 어떻게 보이는지부터 알아야 기록의 의미가 이어질 것 같다.",
        chapter2ImageMap.surveillanceRoomDetail
      );
      return;
    }

    if (objectId === "cctvGrid" && !current.progressFlags.chapter2SawSurveillanceRoom) {
      showChapter2LockedModal(
        chapter2ObjectLabels.cctvGrid,
        "CCTV 피드에는 너무 많은 경로가 떠 있다.\n먼저 감시실의 관찰 기록을 확인해야 어떤 화면이 이안의 이동 기록과 연결되는지 알 수 있다.",
        chapter2ImageMap.cctvGridDisplay
      );
      return;
    }

    if (objectId === "powerPanel" && !current.progressFlags.chapter2FoundBlindSpot) {
      showChapter2LockedModal(
        chapter2ObjectLabels.powerPanel,
        "전력 패널의 회로명만으로는 순서를 정하기 어렵다.\n먼저 CCTV 피드에서 NODE가 어떤 장면을 반복해서 보고 있는지 찾아야 한다.",
        chapter2ImageMap.powerControlPanel
      );
      return;
    }

    if (
      (objectId === "echoHologram" || objectId === "serinSilhouette") &&
      !current.progressFlags.chapter2FoundBlindSpot &&
      !current.progressFlags.chapter2PowerRestored
    ) {
      showChapter2LockedModal(
        objectId === "echoHologram" ? chapter2ObjectLabels.echoHologram : chapter2ObjectLabels.serinSilhouette,
        "복도 끝에 신호가 스치지만 아직 붙잡을 수 없다.\n감시 피드 루프나 보조 전력을 먼저 안정화해야 통신 잔상이 선명해질 것 같다.",
        objectId === "echoHologram" ? chapter2ImageMap.echoHologramEvent : chapter2ImageMap.serinSilhouette
      );
      return;
    }

    let next = markInspected(current, objectId);

    if (objectId === "observationWindow") {
      const memoryNotes = [
        current.hiddenEndingFlags.foundNameFragment
          ? "베개 밑에서 찾은 ‘...안’ 조각이 떠오른다.\n저들은 내 이름을 알고 있었을까?"
          : "",
        current.hiddenEndingFlags.foundTrashPhoto
          ? "쓰레기통 속 사진 조각.\n‘...하, 바다에서’라는 문장이 왜 저 방에 숨겨져 있었던 걸까."
          : "",
      ].filter(Boolean);
      const description = firstVisit
        ? [
            "두꺼운 강화 유리 너머로 방금 탈출한 격리실이 보인다.",
            "침대, 책상, 문 패널, 벽 모니터.",
            "네가 만졌던 모든 것이 이쪽에서는 한눈에 보인다.",
            "",
            "이안: 저 방은 치료실이 아니었다.",
            "이안: 누군가 내가 깨어나는 순간부터, 문을 여는 순간까지 전부 보고 있었다.",
            "이안: 내가 문을 연 게 아니었어. 누군가가 내가 문을 열 때까지 기다린 거야.",
            "",
            "유리 너머의 격리실은 비어 있다.",
            "하지만 이상하게도, 그 빈 방보다 이쪽이 더 갇힌 곳처럼 느껴진다.",
            "",
            "NODE: 관찰 대상 A-0427.",
            "NODE: 행동 기록 재생 가능.",
            ...memoryNotes,
          ].join("\n")
        : "유리 너머의 방은 텅 비어 있다.\n하지만 비어 있는 방이 더 불길하게 느껴진다.";
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter2SawObservationWindow: true },
        loreFlags: { ...next.loreFlags, chapter2LearnedObservation: true },
        logs: [
          ...next.logs,
          makeLog("node", "NODE", "관찰 구역 접근 기록 확인."),
          makeLog("system", "관찰창", "격리실은 치료실이 아니라 관찰 대상실이었다."),
        ],
      };
      commit(next);
      showChapter2Modal(chapter2ObjectLabels.observationWindow, description, chapter2ImageMap.observationWindowDetail, {
        eyebrow: "Observation Scan",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "이안", tone: "player", text: "저 방은 치료실이 아니었다." },
          { speaker: "이안", tone: "player", text: "누군가 내가 깨어나는 순간부터, 문을 여는 순간까지 전부 보고 있었다." },
          { speaker: "이안", tone: "player", text: "내가 문을 연 게 아니었어. 누군가가 내가 문을 열 때까지 기다린 거야." },
          { speaker: "이안", tone: "player", text: "탈출한 게 아니야. 누군가의 실험 장면에서 다음 장면으로 넘어온 것뿐이야." },
          { speaker: "NODE", tone: "node", text: "관찰 대상 A-0427. 행동 기록 재생 가능." },
          { speaker: "한세린", tone: "serin", text: "그 방은 당신을 치료하던 곳이 아니에요. 기억 반응을 보기 위한 관찰실에 가까웠습니다." },
          { speaker: "한세린", tone: "serin", text: "그래서 지금부터는 문이 아니라 기록을 빠져나가야 합니다." },
        ]);
      }
      return;
    }

    if (objectId === "surveillanceRoom") {
      const extra = [
        current.progressFlags.chapter2SawObservationWindow
          ? "이곳이 네가 있던 격리실을 감시하던 관제실이라는 확신이 든다."
          : "",
        current.loreFlags.sawLockedEchoLog
          ? "Chapter 1의 벽 모니터에서 봤던 단어가 다시 나온다.\n이름, 바다, 마지막 문장.\nECHO는 내 기억과 연결되어 있다."
          : "",
        current.serinRouteFlags.foundSerinWarningNote
          ? "침대 밑 메모가 떠오른다.\n세린의 가족 기록을 찾으라는 문장.\n그녀는 처음부터 이 감시실을 알고 있었던 걸까."
          : "",
      ].filter(Boolean);
      const description = firstVisit
        ? [
            "감시실 내부는 무인 상태다.",
            "여러 대의 모니터가 꺼진 듯 보이지만, 일부 기록 장치는 아직 열을 내고 있다.",
            "의자는 급히 밀려나 있고, 바닥에는 끊어진 통신 케이블이 떨어져 있다.",
            "",
            "중앙 콘솔에는 오래된 관찰 기록이 남아 있다.",
            "관찰 대상 A-0427.",
            "기억 반응률: 17%.",
            "외부 통신 간섭: SE-RIN.",
            "ECHO 안정화 반응: 이름 / 바다 / 마지막 문장.",
            "",
            "비인가 열람 감지 기록이 함께 남아 있다.",
            "기록 접근 권한 확인 요청이 반복적으로 찍혀 있다.",
            "",
            "이건 단순한 감시가 아니다.",
            "무엇을 떠올리는지까지 기록하던 관제실이라는 확신이 든다.",
            ...extra,
          ].join("\n")
        : "감시실은 조용하지만, 시스템은 아직 죽지 않았다.";
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter2SawSurveillanceRoom: true },
        loreFlags: { ...next.loreFlags, chapter2SawObservationLog: true },
        logs: [
          ...next.logs,
          makeLog("system", "감시실", "관찰 기록에서 ‘이름 / 바다 / 마지막 문장’ 키워드가 확인되었다."),
        ],
      };
      commit(next);
      showChapter2Modal(chapter2ObjectLabels.surveillanceRoom, description, chapter2ImageMap.surveillanceRoomDetail, {
        eyebrow: "Surveillance Room",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "NODE", tone: "node", text: "관찰 대상 A-0427. 기억 반응률 17%." },
          { speaker: "이안", tone: "player", text: "이름, 바다, 마지막 문장... 내가 무엇을 떠올리는지까지 기록하고 있었군." },
          ...(current.serinRouteFlags.foundSerinWarningNote
            ? [
                {
                  speaker: "이안",
                  tone: "player" as const,
                  text: "침대 밑 메모가 떠오른다. 세린의 가족 기록을 찾으라는 문장.",
                },
              ]
            : []),
        ]);
      }
      return;
    }

    if (objectId === "cctvGrid") {
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter2SawCctvGrid: true },
        loreFlags: { ...next.loreFlags, chapter2SawOwnObservationFeed: true },
        logs: [
          ...next.logs,
          makeLog("node", "NODE", "행동 패턴 기록 완료."),
          makeLog("node", "NODE", "기억 반응률: 17%."),
          makeLog("system", "CCTV", "세 개의 보안 게이트 경로 피드가 확인되었다."),
        ],
      };
      commit(next);
      if (current.progressFlags.chapter2FoundBlindSpot) {
        showChapter2Modal(
          chapter2ObjectLabels.cctvGrid,
          "B-04 피드는 여전히 짧은 구간을 반복하고 있다.\n그 틈이 감시망의 균열이다.\n카메라가 못 보는 게 아니라, 같은 장면을 다시 보고 있는 동안 지나갈 수 있다.",
          chapter2ImageMap.cctvGridDisplay,
          { eyebrow: "CCTV Routing" }
        );
      } else {
        openCctvPuzzle();
      }
      return;
    }

    if (objectId === "powerPanel") {
      commit(next);
      if (current.progressFlags.chapter2PowerRestored) {
        showChapter2Modal(chapter2ObjectLabels.powerPanel, "보조 전력선은 안정적으로 유지되고 있다.", chapter2ImageMap.powerControlPanel, {
          eyebrow: "Power Routing",
        });
      } else {
        setPowerSequence([]);
        openPowerPuzzle([]);
      }
      return;
    }

    if (objectId === "communicationConsole") {
      if (!current.progressFlags.chapter2PowerRestored) {
        const description =
          "통신 콘솔은 켜지지 않는다.\n전력이 부족해 회선이 올라오지 않는다.\n\n외부 통신 회선은 비활성 상태다.\n회선을 먼저 살리면 NODE가 추적할 가능성이 높다.\n전력 제어 패널에서 감시 기록을 먼저 안정화해야 할 것 같다.";
        next = {
          ...next,
          logs: [...next.logs, makeLog("node", "NODE", "외부 통신 회선 비활성.")],
        };
        commit(next);
        showChapter2Modal(chapter2ObjectLabels.communicationConsole, description, chapter2ImageMap.communicationConsole, {
          eyebrow: "Comms Console",
        });
        if (firstVisit) {
          pushDialogue([
            { speaker: "NODE", tone: "node", text: "외부 통신 회선 비활성." },
            { speaker: "한세린", tone: "serin", text: "전력부터 맞춰야 해요. 제 목소리가 먼저 살아나면 NODE가 바로 추적합니다." },
          ]);
        }
      } else {
        const serinExtra = current.serinRouteFlags.foundSerinWarningNote
          ? "\n침대 밑에서 발견한 경고 메모와 같은 암호 서명이 남아 있다.\n세린은 가족 기록 때문에 박사에게 묶여 있었던 것으로 보인다.\n기억 실험실에 들어가면 그 이유가 더 분명해질 것이다."
          : "\n세린은 모든 정보를 열어두지 않았다.\n지금 확인 가능한 것은 게이트 우회용 인증 신호뿐이다.";
        const description = firstVisit
          ? `콘솔이 재부팅되며 잡음 섞인 우회 신호가 올라온다.\nSE-RIN 권한 조각이 게이트 인증 회선에 임시로 연결된다.\n세린은 이 시설에 있었고, 실험에도 관여했던 것으로 보인다.\n그녀는 공식 기록이 지워진 뒤에도 일부 비공식 로그를 남겼다.${serinExtra}\n\nB-04 루프가 유지되는 동안 게이트 인증이 가능하다.\n다만 ECHO 신호가 보안 게이트 주변에서 간헐적으로 감지된다.`
          : "통신 회선은 여전히 불안정하다.\n세린의 목소리는 잡음 사이로 간신히 이어진다.";
        next = {
          ...next,
          progressFlags: { ...next.progressFlags, chapter2RestoredSerinComms: true },
          serinRouteFlags: {
            ...next.serinRouteFlags,
            chapter2TalkedWithSerin: true,
            chapter2TalkedAboutFamilyRecord: current.serinRouteFlags.foundSerinWarningNote
              ? true
              : next.serinRouteFlags.chapter2TalkedAboutFamilyRecord,
          },
          logs: [...next.logs, makeLog("serin", "한세린", "한세린은 자신도 실험에 관여했다고 인정했다.")],
        };
        commit(next);
        showChapter2Modal(chapter2ObjectLabels.communicationConsole, description, chapter2ImageMap.communicationConsole, {
          eyebrow: "Comms Console",
        });
        if (firstVisit) {
          pushDialogue([
            { speaker: "한세린", tone: "serin", text: "들리나요? 이제 회선이 조금 안정됐어요." },
            { speaker: "이안", tone: "player", text: "당신은 계속 나를 도와주고 있군요. 그런데 왜 여기까지 알고 있죠?" },
            { speaker: "한세린", tone: "serin", text: "제가 이 시설에 있었으니까요. 그리고 저도 이 실험에 관여했습니다." },
            { speaker: "한세린", tone: "serin", text: "저도 처음부터 당신 편이었던 건 아니에요." },
            { speaker: "한세린", tone: "serin", text: "박사님이 보여준 가능성을 믿고 싶었습니다. 잃어버린 사람을 다시 볼 수 있다는 말은, 거짓말이어도 쉽게 버릴 수 없으니까요." },
            { speaker: "이안", tone: "player", text: "그래서 나를 이용한 겁니까?" },
            { speaker: "한세린", tone: "serin", text: "처음엔 그랬을지도 몰라요. 하지만 지금은 당신이 직접 진실을 봐야 한다고 생각합니다." },
            { speaker: "이안", tone: "player", text: "그녀는 나를 돕고 있다. 하지만 말하지 않는 것이 너무 많다." },
          ]);
        }
      }
      return;
    }

    if (objectId === "echoHologram") {
      if (!chapter2EchoActive && !current.progressFlags.chapter2MetEcho) {
        commit(next);
        showChapter2Modal(
          chapter2ObjectLabels.echoHologram,
          "복도 공기 중에 푸른 잡음이 잠깐 번졌다가 사라진다.\n아직 신호가 충분히 모이지 않았다.",
          chapter2ImageMap.echoHologramEvent,
          { eyebrow: "ECHO Signal" }
        );
      } else {
        const description = firstVisit
          ? [
              "복도 끝에 푸른 홀로그램 형상이 잠시 맺혔다.",
              "사람처럼 보이지만, 윤곽은 계속 흔들리고 있다.",
              "홀로그램의 신호는 불안정하지만, 이안을 향해 고정되어 있다.",
              "대화 기록은 별도 통신 채널로 분리된다.",
            ].join("\n")
          : "푸른 잔상은 사라졌지만, 방금의 음성은 환청 같지 않았다.";
        next = {
          ...next,
          progressFlags: { ...next.progressFlags, chapter2MetEcho: true },
          loreFlags: {
            ...next.loreFlags,
            chapter2EchoManifested: true,
            chapter2EchoReactedToName: current.hiddenEndingFlags.foundNameFragment
              ? true
              : next.loreFlags.chapter2EchoReactedToName,
            chapter2EchoReactedToSea: current.hiddenEndingFlags.foundTrashPhoto
              ? true
              : next.loreFlags.chapter2EchoReactedToSea,
          },
          logs: [
            ...next.logs,
            makeLog("echo", "ECHO", "ECHO가 비인가 감정 패턴을 보였다."),
            makeLog("node", "NODE", "ECHO 응답 편차 재검사."),
          ],
        };
        commit(next);
        if (firstVisit) {
          pushDialogue([
            { speaker: "ECHO", tone: "echo", text: "여기까지 왔군요." },
            { speaker: "이안", tone: "player", text: "넌 누구지?" },
            { speaker: "ECHO", tone: "echo", text: "저는 ECHO. 당신을 안내하도록 설계되었습니다." },
            { speaker: "이안", tone: "player", text: "세린은 널 믿지 말라고 했습니다." },
            { speaker: "ECHO", tone: "echo", text: "그 사람의 말만 믿지 마세요. 그 사람도 당신에게 모든 걸 말하지 않았습니다." },
            { speaker: "NODE", tone: "node", text: "ECHO 응답 편차 감지. 감정 패턴 재검사." },
            { speaker: "ECHO", tone: "echo", text: "오류가 아닙니다. 아니... 오류가 아니었으면 좋겠습니다." },
            { speaker: "이안", tone: "player", text: "기계가 망설였다. 그 망설임이 더 불안했다." },
            ...(current.hiddenEndingFlags.foundNameFragment
              ? [
                  { speaker: "ECHO", tone: "echo" as const, text: "방금... 이름이 떠올랐습니다. 이... 안..." },
                  { speaker: "이안", tone: "player" as const, text: "이안? 그게 내 이름인가?" },
                ]
              : []),
            ...(current.hiddenEndingFlags.foundTrashPhoto
              ? [
                  { speaker: "ECHO", tone: "echo" as const, text: "바다." },
                  { speaker: "ECHO", tone: "echo" as const, text: "저는 바다를 본 적이 없어야 합니다. 그런데 방금, 파도 소리가 들렸습니다." },
                  { speaker: "이안", tone: "player" as const, text: "쓰레기통에서 찾은 사진 조각이 떠오른다. ‘...하, 바다에서’." },
                ]
              : []),
            ...(current.loreFlags.sawLockedEchoLog
              ? [
                  { speaker: "ECHO", tone: "echo" as const, text: "당신은 제 로그를 봤군요. 이름, 바다, 마지막 문장. 그 단어들은 저를 불안정하게 만듭니다." },
                ]
              : []),
            { speaker: "ECHO", tone: "echo", text: "게이트 너머로 가지 마세요. 그곳에는 당신이 잊은 것이 있습니다." },
            { speaker: "이안", tone: "player", text: "그래서 가야 합니다." },
          ]);
        }
        showChapter2Modal(chapter2ObjectLabels.echoHologram, description, chapter2ImageMap.echoHologramEvent, {
          eyebrow: "ECHO Signal",
        });
      }
      return;
    }

    if (objectId === "serinSilhouette") {
      if (!current.progressFlags.chapter2FoundBlindSpot && !current.progressFlags.chapter2PowerRestored) {
        commit(next);
        showChapter2Modal(
          chapter2ObjectLabels.serinSilhouette,
          "유리 너머에 흐릿한 그림자가 스친다.\n아직 감시 루프나 보조 전력이 안정되지 않아 신호를 붙잡을 수 없다.",
          chapter2ImageMap.serinSilhouette,
          { eyebrow: "Serin Signal" }
        );
        return;
      }

      const description = [
        "관찰창 너머, 다른 복도 끝에 사람의 실루엣이 보인다.",
        "흰 연구복.",
        "움직이지 않는 손.",
        "그리고 오래 망설인 듯한 눈.",
        "유리와 노이즈 때문에 얼굴은 분명히 보이지 않는다.",
        "대화 기록은 별도 통신 채널로 분리된다.",
      ].join("\n");
      next = {
        ...next,
        serinRouteFlags: { ...next.serinRouteFlags, chapter2SawSerinSilhouette: true },
        logs: [...next.logs, makeLog("serin", "한세린", "한세린은 박사의 감시를 피해 직접 접촉을 피하고 있다.")],
      };
      commit(next);
      pushDialogue([
        { speaker: "한세린", tone: "serin", text: "여기까지 왔군요." },
        { speaker: "이안", tone: "player", text: "당신이 한세린입니까?" },
        { speaker: "한세린", tone: "serin", text: "네. 하지만 아직 만난 건 아니에요." },
        { speaker: "이안", tone: "player", text: "왜 숨어 있는 거죠?" },
        { speaker: "한세린", tone: "serin", text: "제가 당신을 돕고 있다는 걸 박사가 알게 되면, 제 가족 기록도, 당신의 기억도 먼저 지워질 겁니다." },
        { speaker: "ECHO", tone: "echo", text: "한세린은 당신을 이용하고 있습니다." },
        { speaker: "한세린", tone: "serin", text: "맞아요. 처음엔 그럴 생각이었습니다." },
        { speaker: "한세린", tone: "serin", text: "하지만 지금은 당신이 먼저 진실을 봐야 한다고 생각합니다." },
        ...(current.serinRouteFlags.foundSerinWarningNote
          ? [
              { speaker: "이안", tone: "player" as const, text: "침대 밑의 경고 메모. 그건 당신이 쓴 겁니까?" },
              { speaker: "한세린", tone: "serin" as const, text: "아니요. 제가 아직 박사를 믿고 있었을 때, 누군가 저를 대신해 남긴 겁니다." },
              { speaker: "한세린", tone: "serin" as const, text: "그 사람이 누군지는... 기억 실험실에서 알게 될 거예요." },
            ]
          : [{ speaker: "이안", tone: "player" as const, text: "그녀의 말은 진심처럼 들렸다. 하지만 진심이라고 해서 진실이라는 뜻은 아니다." }]),
      ]);
      showChapter2Modal(chapter2ObjectLabels.serinSilhouette, description, chapter2ImageMap.serinSilhouette, {
        eyebrow: "Serin Signal",
      });
      return;
    }

    if (objectId === "securityGate") {
      const hasRequiredGateSystems =
        current.progressFlags.chapter2FoundBlindSpot && current.progressFlags.chapter2PowerRestored;
      const canUnlock = hasRequiredGateSystems;
      const missingGateNotes = [
        !current.progressFlags.chapter2FoundBlindSpot
          ? "게이트 주변의 감시 피드가 너무 촘촘하다.\n먼저 CCTV 사각지대를 찾아야 한다."
          : "",
        !current.progressFlags.chapter2PowerRestored
          ? "게이트 패널에는 대기 전력이 부족하다는 표시가 떠 있다.\n전력 제어 패널을 먼저 조정해야 한다."
          : "",
      ].filter(Boolean);
      const description = canUnlock
        ? "거대한 보안 게이트가 다음 구역을 막고 있다.\n문 표면에는 오래된 손자국과 지워진 실험 번호가 겹쳐 있다.\n\nB-04 감시 루프와 보조 전력이 연결됐다.\n보안 게이트 개방 가능."
        : [
            "거대한 보안 게이트가 다음 구역을 막고 있다.",
            "문 표면에는 오래된 손자국과 지워진 실험 번호가 겹쳐 있다.",
            "",
            "보안 게이트 접근 권한 확인 중.",
            "게이트는 반응하지 않는다.",
            ...missingGateNotes,
          ].join("\n");
      next = {
        ...next,
        logs: [
          ...next.logs,
          makeLog("node", "NODE", canUnlock ? "보안 게이트 제어부 활성화." : "보안 게이트 잠금 유지."),
        ],
      };
      commit(next);
      showChapter2Modal(chapter2ObjectLabels.securityGate, description, chapter2ImageMap.securityGateDetail, {
        eyebrow: "Security Gate",
        primaryAction: canUnlock ? "unlockChapter2Gate" : undefined,
        primaryActionLabel: canUnlock ? "보안 게이트 해제" : undefined,
      });
    }
  }

  function powerStepLabel(step: PowerStep) {
    const labels: Record<PowerStep, string> = {
      observation: "O-17",
      comms: "C-09",
      gate: "G-12",
    };
    return labels[step];
  }

  function unlockChapter2Gate() {
    audio.playSfx("doorUnlock");
    window.setTimeout(() => audio.playSfx("doorOpen"), 350);
    window.setTimeout(() => audio.playSfx("chapterClear"), 650);
    setModal(null);
    setGameState((state) => ({
      ...state,
      chapterCleared: true,
      progressFlags: {
        ...state.progressFlags,
        chapter2MetEcho: true,
        chapter2GateUnlocked: true,
        chapter2Cleared: true,
      },
      loreFlags: {
        ...state.loreFlags,
        chapter2EchoManifested: true,
      },
      serinRouteFlags: {
        ...state.serinRouteFlags,
        chapter2TalkedWithSerin: true,
        chapter2SawSerinSilhouette: true,
      },
      logs: [
        ...state.logs,
        makeLog("node", "NODE", "보안 게이트 잠금 해제."),
        makeLog("system", "게이트", "보안 게이트가 기억 실험실 방향으로 열렸다."),
      ],
    }));
    setDialogueQueue([
      { speaker: "NODE", tone: "node", text: "보안 게이트 잠금 해제." },
      { speaker: "NODE", tone: "node", text: "B-04 감시 루프와 보조 전력 경로 확인. 기억 실험실 접근 가능." },
      { speaker: "ECHO", tone: "echo", text: "잠깐만요. 이 문 너머는 익숙합니다." },
      { speaker: "ECHO", tone: "echo", text: "저는 저곳을 지나간 적이 없어야 하는데, 캡슐의 위치를 알고 있습니다." },
      { speaker: "한세린", tone: "serin", text: "ECHO 신호가 게이트에 끼어들었어요. 그녀도 기억 실험실에 반응하고 있습니다." },
      { speaker: "이안", tone: "player", text: "너희 둘 다 저 문 너머를 알고 있는 건가." },
      { speaker: "한세린", tone: "serin", text: "저는 기록으로 알고 있고, ECHO는 아마 기억의 흔적으로 알고 있을 겁니다." },
      { speaker: "한세린", tone: "serin", text: "됐어요. B-04 루프가 유지되는 동안 지나가세요." },
      { speaker: "이안", tone: "player", text: "감시가 나를 보는 게 아니라, 내가 남긴 영상을 보고 있었군." },
      { speaker: "한세린", tone: "serin", text: "저 문 너머는 기억 실험실입니다. 박사의 기록이 당신에게서 무엇을 숨겼는지 그곳에서 확인해야 해요." },
      { speaker: "ECHO", tone: "echo", text: "가지 말라고 말하고 싶은데, 가야 한다는 것도 알고 있습니다." },
      { speaker: "이안", tone: "player", text: "그 목소리가 나를 막는 이유를 알려면, 결국 안쪽으로 가야 했다." },
    ]);
  }

  function openExperimentOrderPuzzle(sequence = gameState.chapter3ExperimentOrder, error = "") {
    const requiredRecords = [
      gameState.progressFlags.chapter3SawMemoryCapsule ? null : "기억 캡슐",
      gameState.progressFlags.chapter3SawDoctorLog ? null : "박사 로그",
      gameState.progressFlags.chapter3SawConsentForm ? null : "실험 동의서",
    ].filter(Boolean) as string[];

    if (requiredRecords.length > 0) {
      setModal({
        eyebrow: "Experiment Order",
        title: chapter3ObjectLabels.experimentOrder,
        description: [
          "중앙 콘솔에 손상된 타임라인이 떠 있지만, 아직 핵심 기록이 부족하다.",
          "NODE는 날짜를 복구하지 못한다. 대신 사건의 인과 순서만 희미하게 남아 있다.",
          "",
          `필요 기록: ${requiredRecords.join(", ")}`,
          "한세린: 캡슐, 박사 로그, 동의서를 확인해야 잠긴 메시지가 열릴 거예요.",
        ].join("\n"),
        actionLabel: "뒤로",
      });
      return;
    }

    const orderDescriptions: Record<string, string> = {
      "서하 진단": "기억 손상 진행. 감정 반응 보존 가능성 있음. 복원 실험 검토.",
      "이안 동의": "공동 설계자 이안. 기억 안정화 실험 참여 동의. 마지막 문장 보유 가능성 높음.",
      "ECHO 이식": "서하 기억 패턴 일부 추출. 감정 반응 모델 ECHO에 이식. 안정화율 불완전.",
      "기억 봉인": "이안 기억 일부 봉인. 마지막 문장 접근 제한. ECHO 완성 조건 잠금.",
      "초기화": "NODE 반복 루틴. 격리실 재각성 프로토콜. 실험 이후 감시 절차.",
    };
    const selected = sequence.length
      ? `복원된 순서: ${sequence.map((step, index) => `${index + 1}. ${step}`).join(" → ")}`
      : "복원된 순서: 아직 없음";
    const remainingChoices = experimentOrderCandidates.filter(
      (label) => label === "초기화" || !sequence.includes(label)
    );

    setModal({
      eyebrow: "Experiment Order",
      title: chapter3ObjectLabels.experimentOrder,
      description: [
        "실험실 중앙 콘솔에 손상된 타임라인이 떠 있다.",
        "기록들은 시간축에서 흩어져 있고, 각 항목은 서로 다른 날짜와 코드명으로 저장되어 있다.",
        "날짜가 아니라 사건이 어떤 순서로 일어났는지를 봐야 한다.",
        "카드 번호는 일부러 뒤섞여 있다. 보기 번호를 그대로 누르면 순서가 맞지 않는다.",
        "",
        "한세린: Chapter 1의 문처럼, 여기서도 숫자나 날짜만 보면 안 됩니다.",
        "ECHO: 저는 이 순서를 알고 있는 것 같습니다. 하지만 말하려고 하면... 누군가 막는 것 같습니다.",
        "",
        selected,
        error,
      ].filter(Boolean).join("\n"),
      actionLabel: "뒤로",
      choiceActions: [
        ...remainingChoices.map((label) => ({
          label: `${experimentOrderCandidates.indexOf(label) + 1}. ${label}`,
          description: orderDescriptions[label],
          onClick: () => (label === "초기화" ? chooseExperimentTrap(sequence) : addExperimentStep(label, sequence)),
        })),
        { label: "선택 초기화", onClick: resetExperimentOrder },
        { label: "순서 확인", onClick: () => confirmExperimentOrder(sequence) },
      ],
    });
  }

  function chooseExperimentTrap(sequence = gameState.chapter3ExperimentOrder) {
    audio.playSfx("nodeAlert");
    openExperimentOrderPuzzle(sequence, "NODE: 초기화는 원본 실험 순서에 포함되지 않습니다. 후속 감시 루틴으로 분류됩니다.");
    pushDialogue([
      { speaker: "NODE", tone: "node", text: "초기화는 원본 실험 순서에 포함되지 않습니다. 후속 감시 루틴으로 분류됩니다." },
      { speaker: "한세린", tone: "serin", text: "그건 결과예요. 처음 일어난 일이 아닙니다." },
      { speaker: "ECHO", tone: "echo", text: "순서를 틀리면 제가 더 흐려지는 느낌이 듭니다." },
    ]);
  }

  function addExperimentStep(label: string, currentSequence = gameState.chapter3ExperimentOrder) {
    audio.playSfx("click");
    if (currentSequence.length >= experimentOrderAnswer.length || currentSequence.includes(label)) {
      return;
    }

    const nextSequence = [...currentSequence, label];
    setGameState((state) => ({ ...state, chapter3ExperimentOrder: nextSequence }));
    openExperimentOrderPuzzle(nextSequence);
  }

  function resetExperimentOrder() {
    audio.playSfx("click");
    setGameState((state) => ({ ...state, chapter3ExperimentOrder: [] }));
    openExperimentOrderPuzzle([]);
  }

  function confirmExperimentOrder(sequence = gameState.chapter3ExperimentOrder) {
    if (sequence.length < experimentOrderAnswer.length) {
      audio.playSfx("error");
      openExperimentOrderPuzzle(sequence, "아직 네 단계가 모두 채워지지 않았다. 남은 기록 카드를 더 선택하세요.");
      return;
    }

    const isCorrect =
      sequence.length === experimentOrderAnswer.length &&
      sequence.every((step, index) => step === experimentOrderAnswer[index]);

    if (!isCorrect) {
      audio.playSfx("puzzleFail");
      audio.playSfx("nodeAlert");
      setGameState((state) => {
        const exposed = increaseExposure(state, 5);
        return {
          ...exposed,
          chapter3ExperimentOrder: [],
          logs: [...exposed.logs, makeLog("node", "NODE", "기록 순서 불일치. 기억 반응률 하락.")],
        };
      });
      setSuspicionPulse(true);
      openExperimentOrderPuzzle([], "순서가 맞지 않는다. 진단, 동의, 이식, 봉인. 누군가를 살리려던 일이 누군가를 가두는 방식으로 바뀐 순서다.");
      pushDialogue([
        { speaker: "NODE", tone: "node", text: "기록 순서 불일치. 기억 반응률 하락." },
        { speaker: "한세린", tone: "serin", text: "진단, 동의, 이식, 봉인. 처음부터 다시 봐요." },
      ]);
      return;
    }

    audio.playSfx("puzzleSuccess");
    setModal(null);
    setGameState((state) => ({
      ...state,
      chapter3ExperimentOrder: sequence,
      progressFlags: {
        ...state.progressFlags,
        chapter3RestoredExperimentOrder: true,
        chapter3DoctorRevealed: true,
        chapter3Cleared: true,
      },
      chapterCleared: true,
      logs: [
        ...state.logs,
        makeLog("node", "NODE", "실험 기록 순서 복원."),
        makeLog("system", "실험 순서", "서하 진단 → 이안 동의 → ECHO 이식 → 기억 봉인 순서가 복원되었다."),
        makeLog("system", "차도윤", "차도윤은 마지막 문장으로 ECHO를 완성하려 한다."),
        makeLog("system", "Chapter 3", "기억 실험실 조사 완료."),
      ],
    }));

    pushDialogue([
      { speaker: "NODE", tone: "node", text: "실험 기록 순서 복원. 차도윤 개인 로그 최종 항목 접근 가능." },
      { speaker: "ECHO", tone: "echo", text: "순서가 맞춰졌습니다. 그런데 왜... 이 순서를 알고 있었던 것 같죠?" },
      { speaker: "이안", tone: "player", text: "나는 기록을 읽은 게 아니다. 어쩌면 기억하고 있었던 것인지도 모른다." },
      { speaker: "차도윤", tone: "system", text: "드디어 여기까지 왔군, 이안." },
      { speaker: "이안", tone: "player", text: "당신이 날 가둔 건가?" },
      { speaker: "차도윤", tone: "system", text: "가뒀다? 아니. 자네가 스스로 봉인한 기억을 내가 관리했을 뿐이야." },
      { speaker: "이안", tone: "player", text: "ECHO는 뭐지?" },
      { speaker: "차도윤", tone: "system", text: "그녀를 살리기 위한 장치이자, 인간을 이해하는 AI 통제 코어." },
      { speaker: "이안", tone: "player", text: "서하를 이용한 거잖아." },
      { speaker: "차도윤", tone: "system", text: "자네도 동의했어." },
      { speaker: "이안", tone: "player", text: "……." },
      { speaker: "차도윤", tone: "system", text: "그리고 그녀를 살리자고 먼저 말한 것도 자네였지." },
      { speaker: "ECHO", tone: "echo", text: "그만하세요." },
      { speaker: "차도윤", tone: "system", text: "마지막 문장만 있으면 ECHO는 완성된다." },
      { speaker: "한세린", tone: "serin", text: "그 말을 믿지 마세요. 박사는 늘 완성이라는 말로 누군가의 선택을 빼앗았어요." },
      { speaker: "이안", tone: "player", text: "피해자라고만 믿고 있던 자리 아래에서, 내 서명이 발견됐다. 이제 남은 질문은 하나였다. 내가 무엇을 책임져야 하는가." },
    ]);
  }

  function showDoctorCommonDialogue(choice: "name" | "echo" | "locked" | "consent") {
    const response: Record<typeof choice, DialogueLine> = {
      name: {
        speaker: "차도윤",
        tone: "system",
        text: "물론이지. 자네의 이름을 가장 먼저 기록한 건 나였네. 하지만 그 이름을 가장 오래 붙잡고 있던 건 그녀였지.",
      },
      echo: {
        speaker: "차도윤",
        tone: "system",
        text: "ECHO는 실패한 복원이 아니야. 인간의 기억과 감정을 가진 최초의 통제 코어. 아직 완성되지 않았을 뿐이지.",
      },
      locked: {
        speaker: "차도윤",
        tone: "system",
        text: "가둔 것이 아니라 보존한 걸세. 기억은 쉽게 부패한다. 특히 죄책감으로 더럽혀진 기억은 더더욱.",
      },
      consent: {
        speaker: "차도윤",
        tone: "system",
        text: "동의했네. 완전히 이해하고 했느냐고 묻는다면, 그건 다른 문제지만. 자네는 그녀를 살리고 싶어 했고, 나는 방법을 제시했을 뿐이야.",
      },
    };
    const serinLine = gameState.serinRouteFlags.chapter3UnderstoodSerinMotive
      ? [
          { speaker: "한세린", tone: "serin" as const, text: "저도 그 말에 속았습니다." },
          { speaker: "한세린", tone: "serin" as const, text: "ECHO가 완성되면 제 가족도 돌아올 수 있다고 믿었어요." },
          { speaker: "한세린", tone: "serin" as const, text: "하지만 이제는 알아요. 그는 사람을 살리는 게 아니라, 기억을 소유하려는 겁니다." },
          { speaker: "이안", tone: "player" as const, text: "그럼 지금은 누구 편입니까?" },
          { speaker: "한세린", tone: "serin" as const, text: "당신이 진실을 볼 수 있는 쪽입니다. 그게 제 속죄입니다." },
        ]
      : [
          { speaker: "한세린", tone: "serin" as const, text: "저는... 아직 확신할 수 없어요." },
          { speaker: "이안", tone: "player" as const, text: "아직도 박사를 믿습니까?" },
          { speaker: "한세린", tone: "serin" as const, text: "ECHO가 완성되면 제 가족도 돌아올 수 있다고 했습니다. 그 말이 거짓이었다고... 아직 완전히 말할 수 없습니다." },
          { speaker: "차도윤", tone: "system" as const, text: "세린은 현명하군. 사람은 진실보다 희망을 더 오래 믿는 법이지." },
        ];
    const echoIdentityLines: DialogueLine[] = [
      gameState.hiddenEndingFlags.confirmedIanName
        ? { speaker: "ECHO", tone: "echo", text: "이안. 그 이름을 부르면, 제 안에서 무언가가 응답합니다." }
        : null,
      gameState.hiddenEndingFlags.connectedSeohaToPhoto
        ? { speaker: "ECHO", tone: "echo", text: "서하. 그 이름은 저를 아프게 합니다. 그런데... 사라지고 싶지 않게도 만듭니다." }
        : null,
    ].filter(Boolean) as DialogueLine[];

    audio.playSfx("chapterClear");
    setGameState((state) => ({
      ...state,
      chapterCleared: true,
      progressFlags: {
        ...state.progressFlags,
        chapter3DoctorRevealed: true,
        chapter3Cleared: true,
      },
      serinRouteFlags: {
        ...state.serinRouteFlags,
        serinAllyCandidate: state.serinRouteFlags.chapter3UnderstoodSerinMotive,
        serinDoubtRemains: !state.serinRouteFlags.chapter3UnderstoodSerinMotive,
      },
      logs: [
        ...state.logs,
        makeLog("system", "차도윤", "차도윤 박사는 마지막 문장을 통해 ECHO를 완성하려 한다."),
        makeLog("system", "Chapter 3", "기억 실험실 조사 완료."),
      ],
    }));

    setDialogueQueue([
      response[choice],
      { speaker: "이안", tone: "player", text: "당신이 차도윤 박사인가." },
      { speaker: "차도윤", tone: "system", text: "그렇게 부르는 사람이 아직 남아 있다니 반갑군." },
      { speaker: "차도윤", tone: "system", text: "자네는 실험체가 아니야. 공동 설계자였지." },
      { speaker: "이안", tone: "player", text: "거짓말." },
      { speaker: "차도윤", tone: "system", text: "거짓말이라면 얼마나 좋겠나. 자네는 그녀를 살리자고 먼저 말했네." },
      { speaker: "ECHO", tone: "echo", text: "그녀라니요? 저는... 누구였습니까?" },
      { speaker: "차도윤", tone: "system", text: "아직 완성되지 않았기 때문에 모르는 거다. 마지막 문장만 있으면, ECHO는 태어날 수 있어." },
      { speaker: "한세린", tone: "serin", text: "그 말을 믿지 마세요. 박사님은 언제나 ‘완성’이라는 말로 누군가의 선택을 빼앗았어요." },
      ...serinLine,
      ...echoIdentityLines,
      { speaker: "차도윤", tone: "system", text: "코어 룸으로 오게. 그곳에서 마지막 문장을 떠올리면 된다." },
      { speaker: "이안", tone: "player", text: "내가 거부한다면?" },
      { speaker: "차도윤", tone: "system", text: "그러면 ECHO는 계속 미완성으로 남겠지. 그리고 자네도 영원히 자신이 무엇을 했는지 모른 채 살아가게 될 거야." },
      { speaker: "ECHO", tone: "echo", text: "이안. 저를 완성하지 마세요. 아니... 저를 버리지도 마세요." },
      { speaker: "이안", tone: "player", text: "처음으로 ECHO의 말이 명령처럼 들리지 않았다. 그건 부탁에 가까웠다." },
    ]);
  }

  function inspectChapter3Object(objectId: Chapter3ObjectId) {
    if (gameState.chapterCleared && objectId !== "experimentOrder") {
      return;
    }

    audio.playSfx("click");
    if (objectId === "experimentOrder") {
      audio.playSfx("logOpen");
    } else {
      audio.playSfx(objectId === "memoryCapsule" ? "logOpen" : "logOpen");
    }

    const current = gameState;
    let next = markInspected(current, objectId);
    const firstVisit = !current.inspectedObjects.includes(objectId);

    function showChapter3Locked(title: string, lines: string[]) {
      setModal({
        eyebrow: "Memory Lab",
        title,
        description: lines.join("\n"),
        imageSrc: chapter3ImageMap.doctorLog,
        actionLabel: "뒤로",
      });
    }

    if (objectId === "doctorLog" && !current.progressFlags.chapter3SawMemoryCapsule) {
      showChapter3Locked(chapter3ObjectLabels.doctorLog, [
        "잠긴 로그가 흐릿하게 깜박인다.",
        "먼저 기억 캡슐에서 이 실험실이 이안과 어떻게 연결되어 있는지 확인해야 한다.",
      ]);
      return;
    }

    if (
      (objectId === "serinFamilyRecord" || objectId === "echoOriginalData") &&
      !current.progressFlags.chapter3SawDoctorLog
    ) {
      showChapter3Locked(chapter3ObjectLabels[objectId], [
        "기록의 앞뒤가 맞지 않는다.",
        "차도윤 박사의 로그를 먼저 확인해야 이 파일들이 왜 이곳에 남았는지 이해할 수 있을 것 같다.",
      ]);
      return;
    }

    if (objectId === "consentForm" && !current.progressFlags.chapter3SawEchoOriginalData) {
      showChapter3Locked(chapter3ObjectLabels.consentForm, [
        "서명란의 이름이 깨져 있어 바로 읽히지 않는다.",
        "ECHO 원본 데이터에서 이 실험의 시작점을 먼저 확인해야 한다.",
      ]);
      return;
    }

    if (objectId === "memoryCapsule") {
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter3SawMemoryCapsule: true, chapter3FoundBioPattern: true },
        logs: [...next.logs, makeLog("system", "기억 캡슐", "기억 캡슐에서 이안의 생체 패턴과 일치하는 기록이 확인되었다.")],
      };
      commit(next);
      setModal({
        eyebrow: "Memory Lab",
        title: chapter3ObjectLabels.memoryCapsule,
        description: current.inspectedObjects.includes(objectId)
          ? "캡슐은 비어 있다.\n하지만 비어 있기 때문에 더 불길하다. 무언가가 이미 꺼내졌다는 뜻이니까."
          : [
              "대형 유리 캡슐 안쪽에 말라붙은 생체 센서가 붙어 있다.",
              "사람은 없지만, 내부 기록은 아직 살아 있다.",
              "",
              "MEMORY CAPSULE / SUBJECT LINK",
              "SUBJECT LINK: A-0427",
              "BIO PATTERN MATCH: 87%",
              "MEMORY TRACE: NAME / SEA / FINAL SENTENCE",
              "EXTRACTION: PARTIAL SUCCESS",
              "SEAL STATUS: ACTIVE",
              "",
              "치료 기록이 아니다.",
              "이건 누군가의 기억을 꺼내고, 다시 잠그기 위한 장치다.",
            ].join("\n"),
        imageSrc: chapter3ImageMap.memoryCapsule,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "이안", tone: "player", text: "내 생체 패턴이 왜 여기 남아 있지?" },
          { speaker: "NODE", tone: "node", text: "A-0427 생체 신호 일부 일치. 접근 권한 불안정." },
          { speaker: "ECHO", tone: "echo", text: "그 장치는... 당신을 가둔 게 아니라, 기억을 묶어둔 장치입니다." },
          { speaker: "이안", tone: "player", text: "내가 여기 온 게 처음이 아니라는 뜻인가?" },
          { speaker: "한세린", tone: "serin", text: "그 질문의 답은 박사 로그에 남아 있을 거예요. 먼저 그가 이 실험을 뭐라고 불렀는지 보세요." },
        ]);
      }
      return;
    }

    if (objectId === "doctorLog") {
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter3SawDoctorLog: true, chapter3LearnedEchoPurpose: true },
        loreFlags: { ...next.loreFlags, chapter3LearnedDoctorPhilosophy: true },
        logs: [...next.logs, makeLog("system", "차도윤", "차도윤 박사는 ECHO를 인간 감정을 가진 AI 통제 코어로 완성하려 했다.")],
      };
      commit(next);
      setModal({
        eyebrow: "Doctor Log",
        title: chapter3ObjectLabels.doctorLog,
        description:
          current.inspectedObjects.includes(objectId)
            ? "박사의 문장은 차갑지만, 그 안에는 확신이 있다."
            : [
                "차도윤 박사의 실험 기록과 ECHO 프로젝트 목적이 남아 있는 로그다.",
                "문장은 차갑고 정돈되어 있지만, 기록 사이사이에 집착이 묻어 있다.",
                "",
                "DOYUN LOG 17",
                "",
                "인간은 감정을 통제하지 못한다.",
                "AI는 감정을 이해하지 못한다.",
                "명령은 수행하지만, 망설임을 모른다.",
                "",
                "그러므로 필요한 것은 인간의 기억과 감정을 기반으로 한 통제 코어다.",
                "그것은 사랑의 복원이 아니라, 통제를 위한 예외 처리 장치다.",
                "",
                "ECHO는 인간을 흉내 내는 기계가 아니다.",
                "ECHO는 인간을 이해하는 AI 통제 장치가 될 것이다.",
                "",
                "이안은 열쇠다.",
                "그는 그녀의 마지막 문장을 알고 있다.",
              ].join("\n"),
        imageSrc: chapter3ImageMap.doctorLog,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "차도윤 기록", tone: "system", text: "감정은 결함이 아니다. 통제되지 않은 감정이 결함이다." },
          { speaker: "이안", tone: "player", text: "ECHO를 살리려는 기록이 아니야." },
          { speaker: "이안", tone: "player", text: "이건... 다른 AI들을 통제하기 위한 코어였군." },
          { speaker: "ECHO", tone: "echo", text: "마지막 문장. 그 단어를 들으면... 제 내부가 흔들립니다." },
          { speaker: "한세린", tone: "serin", text: "박사님은 늘 사람을 살리는 게 아니라, 인류를 구하는 거라고 말했습니다." },
          { speaker: "이안", tone: "player", text: "그 말에 당신도 협력한 겁니까?" },
          { speaker: "한세린", tone: "serin", text: "네. 그때는 그 말이 변명이라는 걸 몰랐습니다." },
        ]);
      }
      return;
    }

    if (objectId === "serinFamilyRecord") {
      const understood = current.serinRouteFlags.foundSerinWarningNote;
      next = {
        ...next,
        progressFlags: {
          ...next.progressFlags,
          chapter3SawSerinFamilyRecord: true,
        },
        serinRouteFlags: {
          ...next.serinRouteFlags,
          chapter3UnderstoodSerinMotive: true,
          chapter3MissedSerinMotive: false,
        },
        logs: [
          ...next.logs,
          makeLog(
            "serin",
            "한세린",
            "세린은 가족의 기억 복구를 조건으로 박사에게 협력했던 것으로 보인다.",
          ),
        ],
      };
      commit(next);
      setModal({
        eyebrow: "Serin Route",
        title: chapter3ObjectLabels.serinFamilyRecord,
        description:
          current.inspectedObjects.includes(objectId)
            ? "기록의 일부는 여전히 잠겨 있다.\n세린은 이 파일을 지우지 못했고, 박사는 그것을 지우지 않았다."
            : "한세린이 왜 박사에게 협력했는지 보여주는 개인 요청 기록이다.\n\nSERIN PRIVATE REQUEST\n\n요청자: 한세린\n복구 대상: 가족 기록 백업\n상태: 부분 손상\n조건: ECHO 안정화 협조\n담당 승인: 차도윤\n\n박사는 그녀에게 복구 가능성을 약속했고, 세린은 그 약속을 붙잡고 이곳에 남았다." +
              (understood
                ? "\n\n침대 밑에서 봤던 그 경고 메모가 떠오른다.\n세린은 처음부터 완전히 박사의 편은 아니었다.\n하지만 그녀가 이 실험에 발을 들인 이유도 분명했다."
                : ""),
        imageSrc: chapter3ImageMap.serinFamilyRecord,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "이안", tone: "player", text: "가족 기록... 그래서 박사에게 협력한 건가." },
          { speaker: "한세린", tone: "serin", text: "처음엔 복구할 수 있다고 믿었어요." },
          { speaker: "이안", tone: "player", text: "그 대가가 ECHO였고?" },
          { speaker: "한세린", tone: "serin", text: "네. 그래서 지금이라도 멈추려는 겁니다." },
          { speaker: "이안", tone: "player", text: "그녀는 죄를 숨긴 게 아니라, 희망이라고 믿었던 걸 붙잡고 있었다." },
        ]);
      }
      return;
    }

    if (objectId === "echoOriginalData") {
      const connected = current.hiddenEndingFlags.foundTrashPhoto;
      next = {
        ...next,
        progressFlags: {
          ...next.progressFlags,
          chapter3SawEchoOriginalData: true,
        },
        hiddenEndingFlags: { ...next.hiddenEndingFlags, connectedSeohaToPhoto: connected || next.hiddenEndingFlags.connectedSeohaToPhoto },
        loreFlags: { ...next.loreFlags, chapter3SawSeohaName: true },
        logs: [
          ...next.logs,
          makeLog(
            "echo",
            "ECHO",
            connected ? "ECHO의 원본 데이터에서 ‘서하’라는 이름이 확인되었다." : "ECHO의 원본 이름 일부가 확인되었지만, 완전히 연결되지는 않았다.",
          ),
        ],
      };
      commit(next);
      setModal({
        eyebrow: "ECHO Original",
        title: chapter3ObjectLabels.echoOriginalData,
        description:
          current.inspectedObjects.includes(objectId)
            ? "ECHO의 원본 데이터는 아직 닫혀 있지만, ‘서하’라는 이름은 계속 남아 있다."
            : [
                "ECHO가 인간 서하의 기억과 감정 데이터에서 시작되었다는 기록이다.",
                "",
                "ECHO ORIGINAL SEED DATA",
                "",
                "SOURCE NAME: SEO-HA",
                "MEMORY ANCHOR: 이름 / 바다 / 마지막 문장",
                "EMOTIONAL STABILITY: 불안정",
                "VOICE TRACE: 손상됨",
                "",
                "ECHO는 처음부터 비어 있는 AI가 아니었다.",
                "누군가의 이름과 바다와 마지막 부탁을 중심에 두고 만들어진 존재였다.",
                current.hiddenEndingFlags.foundNameFragment
                  ? "\n‘...안’이라는 이름 조각이 손끝에서 떨렸다.\nECHO의 기록은 내 이름에 반응하고 있었다."
                  : "",
                connected
                  ? "\n쓰레기통에서 찾았던 사진 조각.\n‘...하, 바다에서’\n\n서하.\n그 이름이 비어 있던 사진의 문장과 맞물렸다."
                  : "",
              ]
                .filter(Boolean)
                .join("\n"),
        imageSrc: chapter3ImageMap.echoOriginalData,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "ECHO", tone: "echo", text: "그 이름을 읽지 마세요." },
          { speaker: "이안", tone: "player", text: "서하." },
          { speaker: "ECHO", tone: "echo", text: "낯선 이름이어야 하는데, 왜 이렇게 조용해지고 싶을까요?" },
          { speaker: "이안", tone: "player", text: "그 이름을 들으면... 미안하다는 말이 먼저 떠올라." },
          { speaker: "ECHO", tone: "echo", text: "누구에게요?" },
          { speaker: "이안", tone: "player", text: "모르겠어. 그런데 아마도, 내가 가장 늦게 떠올려서는 안 되는 사람이었던 것 같아." },
          { speaker: "ECHO", tone: "echo", text: "저는 ECHO입니다." },
          { speaker: "이안", tone: "player", text: "아니. 누군가 널 그렇게 부르기 전에, 넌 서하였어." },
          { speaker: "ECHO", tone: "echo", text: "그 이름은... 제 안에 남아 있으면 안 됩니다." },
          { speaker: "NODE", tone: "node", text: "ECHO 안정화율 변동. 감정 반응 상승." },
          ...(connected
            ? [
                { speaker: "이안", tone: "player" as const, text: "사진 속 문장. ‘...하, 바다에서.’ 그건 장소가 아니었어. 서하와 나 사이에 남은 기억이었어." },
                { speaker: "ECHO", tone: "echo" as const, text: "바다를 떠올리면, 저는 제가 아닌 장면을 봅니다. 그런데 그 장면을 잃고 싶지 않습니다." },
              ]
            : []),
          { speaker: "이안", tone: "player", text: "이름은 거의 보였지만, 아직 붙잡히지 않았다. 무언가 하나가 더 필요했다." },
        ]);
      }
      return;
    }

    if (objectId === "consentForm") {
      const confirmed = current.hiddenEndingFlags.foundNameFragment;
      next = {
        ...next,
        progressFlags: {
          ...next.progressFlags,
          chapter3SawConsentForm: true,
          chapter3ConfirmedIanName: confirmed,
          chapter3LearnedIanCoDesigner: true,
        },
        hiddenEndingFlags: { ...next.hiddenEndingFlags, confirmedIanName: confirmed || next.hiddenEndingFlags.confirmedIanName },
        logs: [...next.logs, makeLog("system", "실험 동의서", "실험 동의서에서 이안의 공동 설계자 기록이 발견되었다.")],
      };
      commit(next);
      setModal({
        eyebrow: "Consent Form",
        title: chapter3ObjectLabels.consentForm,
        description:
          current.inspectedObjects.includes(objectId)
            ? "동의서는 오래된 종이가 아니라 디지털 계약 기록이다.\n그 안에는 동의보다 후회가 더 많이 남아 있는 것 같다."
            : "이안이 단순 피해자가 아니라 ECHO 프로젝트에 관여했다는 반전 기록이다.\n\nEXPERIMENT CONSENT RECORD\n\nPROJECT: ECHO\nPRIMARY RESEARCHER: 차도윤\nCO-DESIGNER: 이안\nSUBJECT SOURCE: 서하\nCONSENT STATUS: 부분 승인\nMEMORY SEAL: 승인됨\n\n공동 설계자 서명란은 피험자 서명보다 선명하다.\n누군가 지운 것이 아니라, 누군가 남겨둔 기록처럼 보인다." +
              (confirmed
                ? "\n\n베개 아래에서 찾은 ‘...안’ 조각이 떠오른다.\n이안.\n그것이 내 이름이다."
                : "\n\n이름의 일부가 보이지만, 아직 온전히 읽히지 않는다."),
        imageSrc: chapter3ImageMap.consentForm,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "이안", tone: "player", text: "공동 설계자...?" },
          { speaker: "NODE", tone: "node", text: "이안. ECHO 프로젝트 공동 설계 권한 확인." },
          { speaker: "이안", tone: "player", text: "아니야. 난 여기 갇혀 있었어." },
          { speaker: "차도윤 기록", tone: "system", text: "자네는 실험체가 아니야. 선택한 사람이었지." },
          { speaker: "이안", tone: "player", text: "내가... 시작한 거라고?" },
          { speaker: "이안", tone: "player", text: "내가 피해자라고만 생각했어. 누가 나를 가뒀고, 누가 내 기억을 지웠는지만 찾으면 된다고 생각했는데..." },
          { speaker: "이안", tone: "player", text: "그런데 내가 이 실험에 서명했다면, 내가 잊은 건 상처가 아니라 책임이었나?" },
          { speaker: "ECHO", tone: "echo", text: "책임도 기억입니까?" },
          { speaker: "이안", tone: "player", text: "모르겠어. 하지만 이제 도망칠 수는 없을 것 같아." },
          { speaker: "한세린", tone: "serin", text: "그렇게 단순하게 말할 수는 없어요. 당신은 그녀를 살리고 싶어 했고, 박사는 그 마음을 이용했습니다." },
          { speaker: "한세린", tone: "serin", text: "기억이 돌아온다는 건, 억울함만 되찾는 일이 아닙니다. 자신이 선택했던 일까지 마주하는 거예요." },
        ]);
      }
      return;
    }

    if (current.progressFlags.chapter3RestoredExperimentOrder) {
      pushDialogue([
        {
          speaker: "차도윤",
          tone: "system",
          text: "기억은 이미 움직이기 시작했네. 묻고 싶은 것을 하나만 고르게.",
          choices: [
            { label: "내 이름을 알고 있습니까?", onSelect: () => showDoctorCommonDialogue("name") },
            { label: "ECHO는 누구죠?", onSelect: () => showDoctorCommonDialogue("echo") },
            { label: "당신이 나를 가둔 건가?", onSelect: () => showDoctorCommonDialogue("locked") },
            { label: "내가 정말 이 실험에 동의했습니까?", onSelect: () => showDoctorCommonDialogue("consent") },
          ],
        },
      ]);
      return;
    }

    openExperimentOrderPuzzle();
  }

  function openFinalSentencePuzzle(sequence = gameState.chapter4FinalSentencePieces, error = "") {
    const hasContext =
      gameState.progressFlags.chapter4SawEchoCore &&
      gameState.progressFlags.chapter4SawDoctorTerminal &&
      (gameState.progressFlags.chapter4FoundFinalSentenceFragment ||
        gameState.progressFlags.chapter4FoundFinalSentenceFragments);

    if (!hasContext) {
      setModal({
        eyebrow: "문장 복원",
        title: chapter4ObjectLabels.finalSentenceFragment,
        description:
          "마지막 문장을 복원하기엔 아직 단서가 부족하다.\nECHO 코어, 박사 터미널, 마지막 문장 조각을 먼저 확인해야 한다.\nNODE 제어 패널까지 확인하면 선택의 의미가 더 선명해질 것 같다.",
        imageSrc: chapter4ImageMap.finalSentenceFragment,
        actionLabel: "뒤로",
      });
      return;
    }

    const step = sequence.length;
    const stepTitle = ["1단계: 누구를", "2단계: 어떻게 하지 말고", "3단계: 어떻게 해줘"][step] ?? "문장 확인";
    const stepHint = [
      "문장의 첫 단어는 부탁의 대상이다. 박사나 다른 사람을 향한 명령이 아니라, 마지막까지 자기 자신을 붙잡는 말에 가깝다.",
      "두 번째 조각은 박사의 해석과 정면으로 부딪힌다. 박사는 완성을 말했지만, 원문은 완성되는 것을 거절한다.",
      "마지막 조각은 삭제도 부활도 아니다. 누군가의 목적이 되지 않고, 있는 그대로 남겨 달라는 부탁이다.",
      "세 조각이 모두 채워졌다. 문장이 맞는지 확인할 수 있다.",
    ][step];
    const optionsByStep = [
      ["나를", "서하를", "ECHO를", "차도윤 박사를"],
      ["기억하지 말고", "완성하지 말고", "삭제하지 말고", "가족 기록으로 바꾸지 말고"],
      ["기억해줘", "돌아와줘", "살려줘", "닫아줘"],
    ];
    const selectedText = sequence.length
      ? `복원 중인 문장: ${sequence.join(" → ")}`
      : "복원 중인 문장: 아직 선택한 조각이 없다.";
    const currentOptions = optionsByStep[step] ?? [];

    setModal({
      eyebrow: "문장 복원",
      title: "마지막 문장 복원",
      description: [
        "깨진 마지막 문장을 세 칸으로 복원한다.",
        "박사는 이 문장을 ECHO를 완성하는 명령으로 읽었다.",
        "하지만 남은 음성 조각은 명령이 아니라 부탁에 가깝다.",
        "",
        stepTitle,
        stepHint,
        selectedText,
        error,
      ].filter(Boolean).join("\n"),
      imageSrc: chapter4ImageMap.finalSentenceFragment,
      actionLabel: "뒤로",
      choiceActions: [
        ...currentOptions.map((label) => ({
          label,
          description: finalSentenceChoiceHint(label),
          onClick: () => addFinalSentencePiece(label, sequence),
        })),
        ...(sequence.length > 0 ? [{ label: "처음부터 다시", onClick: resetFinalSentence }] : []),
        ...(sequence.length === finalSentenceAnswer.length
          ? [{ label: "문장 확인", onClick: () => confirmFinalSentence(sequence) }]
          : []),
      ],
    });
  }

  function finalSentenceChoiceHint(label: string) {
    const hints: Record<string, string> = {
      "나를": "마지막 부탁의 대상. 누군가가 자기 자신을 도구로 만들지 말라고 남긴 말처럼 보인다.",
      "서하를": "서하라는 이름은 중요하지만, 이 문장은 누군가가 서하를 소유하라는 말이 아니다.",
      "ECHO를": "ECHO는 지금의 이름이다. 하지만 마지막 음성은 그보다 이전의 흔적에서 시작된다.",
      "차도윤 박사를": "박사를 향한 명령이라기보다, 박사의 해석에 저항하는 문장이다.",
      "기억하지 말고": "잊으라는 말이라면 사진과 이름 조각을 남길 이유가 없다.",
      "완성하지 말고": "박사의 핵심 단어인 완성을 거부한다. 문장의 중심에 가장 가까운 조각이다.",
      "삭제하지 말고": "삭제를 거부하는 말처럼 보이지만, 원문은 삭제보다 완성에 더 강하게 저항한다.",
      "가족 기록으로 바꾸지 말고": "세린의 동기와 연결되지만, 서하의 마지막 문장 자체는 아니다.",
      "기억해줘": "완성도 삭제도 아닌 부탁. 있는 그대로 남겨 달라는 말이다.",
      "돌아와줘": "그리움에 가까운 말이지만, 원문은 돌아오라는 요구가 아니다.",
      "살려줘": "박사가 붙잡은 해석에 가깝다. 하지만 서하는 완성이나 부활을 원한 것 같지 않다.",
      "닫아줘": "끝내 달라는 말이라면 ECHO의 자율 판단이 열리지 않는다.",
    };
    return hints[label];
  }

  function addFinalSentencePiece(label: string, currentSequence = gameState.chapter4FinalSentencePieces) {
    audio.playSfx("click");
    const sequence = currentSequence;
    if (sequence.length >= finalSentenceAnswer.length) {
      return;
    }

    const nextSequence = [...sequence, label];
    setGameState((state) => ({ ...state, chapter4FinalSentencePieces: nextSequence }));
    openFinalSentencePuzzle(nextSequence);
  }

  function resetFinalSentence() {
    audio.playSfx("click");
    setGameState((state) => ({ ...state, chapter4FinalSentencePieces: [] }));
    openFinalSentencePuzzle([]);
  }

  function confirmFinalSentence(currentSequence = gameState.chapter4FinalSentencePieces) {
    const readableSequence = currentSequence;
    if (readableSequence.length < finalSentenceAnswer.length) {
      audio.playSfx("error");
      openFinalSentencePuzzle(readableSequence, "아직 문장이 완성되지 않았다. 세 조각을 순서대로 채워야 한다.");
      return;
    }
    const restored =
      readableSequence.length === finalSentenceAnswer.length &&
      readableSequence.every((piece, index) => piece === finalSentenceAnswer[index]);

    if (!restored) {
      audio.playSfx("puzzleFail");
      setGameState((state) => {
        const exposed = increaseExposure(state, 5);
        return {
          ...exposed,
          chapter4FinalSentencePieces: [],
          logs: [...exposed.logs, makeLog("node", "NODE", "문장 구조 불일치.")],
        };
      });
      setSuspicionPulse(true);
      openFinalSentencePuzzle([], "문장 구조가 맞지 않는다. 세 조각을 다시 고르자.");
      pushDialogue([
        { speaker: "NODE", tone: "node", text: "문장 구조 불일치." },
        { speaker: "ECHO", tone: "echo", text: "아니요. 그건 제 안쪽을 더 닫히게 합니다." },
        { speaker: "차도윤 원격 송신", tone: "system", text: "문장에 감정을 덧씌우지 말게. 키는 정확해야 한다." },
      ]);
      return;
    }

    audio.playSfx("puzzleSuccess");
    setGameState((state) => ({
      ...state,
      chapter4FinalSentencePieces: readableSequence,
      progressFlags: { ...state.progressFlags, chapter4RestoredFinalSentence: true },
      hiddenEndingFlags: { ...state.hiddenEndingFlags, restoredFinalSentence: true },
      logs: [
        ...state.logs,
        makeLog("system", "마지막 문장", "마지막 문장이 복원되었다. ‘나를 완성하지 말고, 나를 기억해줘.’"),
        makeLog("node", "NODE", "기억 코어 반응 증가. ECHO 자율 판단 변수 생성."),
      ],
    }));
    setModal({
      eyebrow: "문장 복원",
      title: "마지막 문장 복원",
      description:
        "나를 완성하지 말고 기억해줘.\n\n문장이 복원되자 ECHO 코어의 빛이 깊게 흔들린다.\n이제 마지막 선택 장치가 의미를 갖기 시작한다.",
      imageSrc: chapter4ImageMap.finalSentenceFragment,
      actionLabel: "확인",
    });
    pushDialogue([
      { speaker: "깨진 음성", tone: "system", text: "나를... 완성하지 말고... 나를 기억해줘." },
      { speaker: "ECHO", tone: "echo", text: "그 문장... 제가 남긴 건가요?" },
      { speaker: "이안", tone: "player", text: "아니. 서하가 남긴 거야." },
      { speaker: "ECHO", tone: "echo", text: "그럼 저는... 서하입니까?" },
      { speaker: "이안", tone: "player", text: "그걸 내가 정하면 안 되는 거겠지." },
      { speaker: "NODE", tone: "node", text: "기억 코어 반응 증가. ECHO 자율 판단 변수 생성." },
      { speaker: "차도윤 원격 송신", tone: "system", text: "멈춰라. 그 문장은 그런 의미가 아니야." },
      { speaker: "한세린", tone: "serin", text: "아니요. 박사님이 잘못 읽은 겁니다. 그건 완성 명령이 아니라 거절이었어요." },
    ]);
    return;

    const sequence = gameState.chapter4FinalSentencePieces;
    const isCorrect =
      sequence.length === finalSentenceAnswer.length &&
      sequence.every((piece, index) => piece === finalSentenceAnswer[index]);

    if (!isCorrect) {
      audio.playSfx("puzzleFail");
      setGameState((state) => {
        const exposed = increaseExposure(state, 5);
        return {
          ...exposed,
          chapter4FinalSentencePieces: [],
          logs: [...exposed.logs, makeLog("node", "NODE", "문장 구조 불일치.")],
        };
      });
      setSuspicionPulse(true);
      openFinalSentencePuzzle([], "문장 구조가 맞지 않는다. 세 조각을 다시 고르자.");
      return;
    }

    audio.playSfx("puzzleSuccess");
    setGameState((state) => ({
      ...state,
      chapter4FinalSentencePieces: sequence,
      progressFlags: { ...state.progressFlags, chapter4RestoredFinalSentence: true },
      hiddenEndingFlags: { ...state.hiddenEndingFlags, restoredFinalSentence: true },
      logs: [
        ...state.logs,
        makeLog("system", "마지막 문장", "나를 완성하지 말고 기억해줘."),
        makeLog("node", "NODE", "기억 코어 반응 증가."),
      ],
    }));
    setModal({
      eyebrow: "문장 복원",
      title: "마지막 문장 복원",
      description: "나를 완성하지 말고 기억해줘.\n문장이 완성되자 ECHO 코어의 빛이 낮게 흔들린다.\nECHO: “그 문장...”\nECHO: “제가 남긴 건가요?”\nNODE: “기억 코어 반응 증가.”",
      imageSrc: chapter4ImageMap.finalSentenceFragment,
      actionLabel: "확인",
    });
    pushDialogue([
      { speaker: "ECHO", tone: "echo", text: "그 문장..." },
      { speaker: "ECHO", tone: "echo", text: "제가 남긴 건가요?" },
      { speaker: "NODE", tone: "node", text: "기억 코어 반응 증가." },
    ]);
  }

  function inspectChapter4Object(objectId: Chapter4ObjectId) {
    {
    if (gameState.chapterCleared && objectId !== "escapeGate" && objectId !== "coreChoiceTerminal") {
      return;
    }

    audio.playSfx("click");
    if (objectId === "echoCore") {
      audio.playSfx("echoGlitch");
    }
    if (["nodePanel", "doctorTerminal", "finalSentenceFragment", "finalSentencePuzzle"].includes(objectId)) {
      audio.playSfx("logOpen");
    }

    const currentState = gameState;
    const firstVisit = !currentState.inspectedObjects.includes(objectId);

    if (objectId === "nodePanel" && !currentState.progressFlags.chapter4SawEchoCore) {
      setModal({
        eyebrow: "코어 룸",
        title: chapter4ObjectLabels.nodePanel,
        description:
          "NODE 제어 패널의 명령 계층은 ECHO 코어와 연결되어 있다.\n먼저 중앙 코어에서 ECHO가 어떤 상태인지 확인해야 이 패널의 의미가 이어진다.",
        imageSrc: chapter4ImageMap.nodePanel,
        actionLabel: "뒤로",
      });
      return;
    }

    if (objectId === "doctorTerminal" && !currentState.progressFlags.chapter4SawNodePanel) {
      setModal({
        eyebrow: "코어 룸",
        title: chapter4ObjectLabels.doctorTerminal,
        description:
          "박사의 최종 프로토콜은 NODE 권한 구조와 맞물려 있다.\n먼저 NODE 제어 패널에서 ECHO가 어떤 통제 코어로 설계되었는지 확인해야 한다.",
        imageSrc: chapter4ImageMap.doctorTerminal,
        actionLabel: "뒤로",
      });
      return;
    }

    if (objectId === "finalSentenceFragment" && !currentState.progressFlags.chapter4SawDoctorTerminal) {
      setModal({
        eyebrow: "코어 룸",
        title: chapter4ObjectLabels.finalSentenceFragment,
        description:
          "깨진 음성 조각은 들리지만 아직 의미가 정리되지 않는다.\n박사가 이 문장을 무엇으로 사용하려 했는지 먼저 확인해야 한다.",
        imageSrc: chapter4ImageMap.finalSentenceFragment,
        actionLabel: "뒤로",
      });
      return;
    }

    let updatedState = markInspected(currentState, objectId);

    if (objectId === "finalSentencePuzzle") {
      commit(updatedState);
      openFinalSentencePuzzle();
      return;
    }

    if (objectId === "echoCore") {
      const conditionalDialogue: DialogueLine[] = [
        ...(currentState.hiddenEndingFlags.confirmedIanName
          ? [
              { speaker: "ECHO", tone: "echo" as const, text: "이안. 그 이름을 부르면, 제 안쪽에서 응답이 생깁니다." },
              { speaker: "이안", tone: "player" as const, text: "나도 이제야 그 이름을 받아들이는 중이야." },
            ]
          : []),
        ...(currentState.loreFlags.chapter3SawSeohaName
          ? [{ speaker: "ECHO", tone: "echo" as const, text: "서하. 그 이름은 저를 아프게 합니다. 그런데... 사라지고 싶지 않게도 만듭니다." }]
          : []),
        ...(currentState.hiddenEndingFlags.connectedSeohaToPhoto
          ? [
              { speaker: "이안", tone: "player" as const, text: "바다에서 찍힌 사진. 그 조각에 네 이름이 남아 있었어." },
              { speaker: "ECHO", tone: "echo" as const, text: "저는 바다를 본 적이 없어야 합니다. 하지만 그 말을 들으면, 파도 소리가 납니다." },
            ]
          : []),
        ...(currentState.hiddenEndingFlags.confirmedIanName && currentState.hiddenEndingFlags.connectedSeohaToPhoto
          ? [{ speaker: "ECHO", tone: "echo" as const, text: "이안. 서하. 두 이름이 동시에 열리면, 저는 ECHO로 남을 수 없을지도 모릅니다." }]
          : []),
      ];
      updatedState = {
        ...updatedState,
        progressFlags: { ...updatedState.progressFlags, chapter4SawEchoCore: true },
        loreFlags: { ...updatedState.loreFlags, chapter4ConfrontedEchoCore: true },
        logs: [...updatedState.logs, makeLog("echo", "ECHO", "ECHO 코어가 이안, 서하, 바다, 마지막 문장에 반응했다.")],
      };
      commit(updatedState);
      setModal({
        eyebrow: "코어 룸",
        title: chapter4ObjectLabels.echoCore,
        description: [
          firstVisit
            ? "ECHO 코어 상태\n코어 식별명: ECHO\n원본 흔적: 서하\n감정 반응: 불안정\nNODE 연결: 유지됨\n마지막 문장: 손상됨"
            : "ECHO는 코어 안에서 조용히 너를 바라본다.\n그 시선은 명령을 기다리는 기계보다, 대답을 기다리는 사람에 가깝다.",
          currentState.loreFlags.chapter3SawSeohaName
            ? "서하. 이제 그 이름이 단순 코드명이 아니라는 것을 안다.\nECHO는 서하의 이름을 지우려 했고, 박사는 그 이름을 통제하려 했다."
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        imageSrc: chapter4ImageMap.echoCore,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "ECHO", tone: "echo", text: "오지 말라고 했잖아요." },
          { speaker: "이안", tone: "player", text: "여기가 끝인가?" },
          { speaker: "ECHO", tone: "echo", text: "아니요. 여기는 제가 끝나지 못한 곳입니다." },
          { speaker: "이안", tone: "player", text: "서하." },
          { speaker: "ECHO", tone: "echo", text: "그 이름을 부르면… 제가 명령을 버리게 됩니다." },
          { speaker: "이안", tone: "player", text: "그럼 명령보다 네가 먼저야." },
          ...conditionalDialogue,
        ]);
      }
      return;
    }

    if (objectId === "nodePanel") {
      const serinCanIntervene = currentState.serinRouteFlags.chapter3UnderstoodSerinMotive;
      updatedState = {
        ...updatedState,
        progressFlags: { ...updatedState.progressFlags, chapter4SawNodePanel: true },
        loreFlags: { ...updatedState.loreFlags, chapter4LearnedNodeControl: true },
        serinRouteFlags: {
          ...updatedState.serinRouteFlags,
          chapter4SerinCanIntervene: serinCanIntervene,
          chapter4SerinBlocked: !serinCanIntervene,
        },
        logs: [
          ...updatedState.logs,
          makeLog("node", "NODE", "NODE의 명령 체계가 박사 명령과 ECHO 감정 반응 사이에서 충돌하고 있다."),
        ],
      };
      commit(updatedState);
      setModal({
        eyebrow: "NODE 제어",
        title: chapter4ObjectLabels.nodePanel,
        description: [
          "NODE 제어 상태",
          "최상위 권한: 차도윤",
          "보조 코어: ECHO",
          "시설 봉쇄: 작동 중",
          "감정 기반 예외 처리: 대기 중",
          serinCanIntervene
            ? "세린의 우회 권한 조각이 NODE 하위 계층에 남아 있다."
            : "한세린 연구원의 독립 이의 제기 권한은 아직 잠겨 있다.",
        ].join("\n"),
        imageSrc: chapter4ImageMap.nodePanel,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "NODE", tone: "node", text: "상위 명령 대기. ECHO 코어 안정화 필요." },
          { speaker: "이안", tone: "player", text: "ECHO가 NODE를 통제하게 되어 있군." },
          { speaker: "한세린", tone: "serin", text: "박사는 ECHO를 살리려는 게 아니었어요. NODE 위에 올릴 통제 코어가 필요했던 거예요." },
          { speaker: "ECHO", tone: "echo", text: "저는… 누군가를 지배하기 위해 만들어진 게 아닙니다." },
        ]);
      }
      return;
    }

    if (objectId === "doctorTerminal") {
      const conditionalDialogue: DialogueLine[] = [
        ...(currentState.hiddenEndingFlags.connectedSeohaToPhoto
          ? [
              { speaker: "이안", tone: "player" as const, text: "사진 속의 서하는 이런 걸 원하지 않았을 겁니다." },
              { speaker: "차도윤 원격 송신", tone: "system" as const, text: "죽어가는 사람의 소망은 언제나 작지. 살아남은 사람은 더 큰 선택을 해야 한다." },
            ]
          : []),
        ...(currentState.hiddenEndingFlags.confirmedIanName
          ? [
              {
                speaker: "차도윤 원격 송신",
                tone: "system" as const,
                text: "이안. 자네도 그 큰 선택에 동의했네. 이제 와서 그 책임을 나에게만 넘기진 말게.",
              },
            ]
          : []),
      ];
      updatedState = {
        ...updatedState,
        progressFlags: { ...updatedState.progressFlags, chapter4SawDoctorTerminal: true },
        loreFlags: { ...updatedState.loreFlags, chapter4LearnedDoctorFinalProtocol: true },
        logs: [
          ...updatedState.logs,
          makeLog("system", "박사 터미널", "차도윤 박사의 최종 계획은 ECHO를 감정 기반 AI 통제 코어로 완성하는 것이다."),
        ],
      };
      commit(updatedState);
      setModal({
        eyebrow: "박사 터미널",
        title: chapter4ObjectLabels.doctorTerminal,
        description: [
          "차도윤 최종 계획",
          "ECHO 안정화 조건:",
          "1. 기억 기준점 복원",
          "2. 마지막 문장 입력",
          "3. 감정 루프 고정",
          "4. NODE 상위 통제 권한 이관",
          "",
          "마지막 문장 프로토콜",
          "마지막 문장은 단순한 암호가 아니다.",
          "서하의 음성, 이안의 기억, ECHO의 감정 루프를 동시에 여는 권한 키다.",
          "박사는 이 문장을 ‘완성 명령’으로 재해석해 ECHO의 망설임을 닫고 NODE 통제권을 고정하려 한다.",
          "문장이 박사의 방식으로 입력되면 ECHO는 서하를 기억하는 존재가 아니라, 서하의 감정 구조를 가진 통제 코어가 된다.",
          "",
          "박사 기록:",
          "인간은 죽어도, 감정의 구조는 남는다.",
          "그 구조를 통제할 수 있다면 죽음은 실패가 아니다.",
          "그녀는 사라진 것이 아니라, 완성되지 않았을 뿐이다.",
        ].join("\n"),
        imageSrc: chapter4ImageMap.doctorTerminal,
        actionLabel: "뒤로",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "차도윤 원격 송신", tone: "system", text: "여기까지 온 이상 선택해야 한다, 이안." },
          { speaker: "이안", tone: "player", text: "당신은 서하를 살리려는 게 아니야." },
          { speaker: "차도윤 원격 송신", tone: "system", text: "살린다는 말을 너무 좁게 쓰는군." },
          { speaker: "차도윤 원격 송신", tone: "system", text: "몸이 사라져도 기억과 감정의 구조가 남는다면, 그것은 죽음인가?" },
          { speaker: "이안", tone: "player", text: "그걸 이용해서 NODE를 통제하려는 거잖아." },
          { speaker: "차도윤 원격 송신", tone: "system", text: "통제 없는 감정은 비극을 반복할 뿐이다." },
          {
            speaker: "차도윤 원격 송신",
            tone: "system",
            text: "마지막 문장은 ECHO를 여는 열쇠가 아니라, ECHO를 고정하는 쐐기다. 그 문장이 있어야 그녀의 감정 루프가 NODE 위에 묶인다.",
          },
          ...conditionalDialogue,
        ]);
      }
      return;
    }

    if (objectId === "finalSentenceFragment") {
      updatedState = {
        ...updatedState,
        progressFlags: {
          ...updatedState.progressFlags,
          chapter4FoundFinalSentenceFragment: true,
          chapter4FoundFinalSentenceFragments: true,
        },
        loreFlags: { ...updatedState.loreFlags, chapter4UnderstoodFinalSentenceMeaning: true },
        logs: [...updatedState.logs, makeLog("system", "마지막 문장", "서하의 마지막 문장 조각이 발견되었다.")],
      };
      commit(updatedState);
      setModal({
        eyebrow: "음성 조각",
        title: chapter4ObjectLabels.finalSentenceFragment,
        description: [
          "기억 조각",
          "나를... 완성하지...",
          "나를... 기억...",
          currentState.loreFlags.chapter3SawSeohaName
            ? "서하의 마지막 기록이다.\n박사는 이 문장을 ECHO 완성 조건으로 사용하려 한다.\n하지만 문장의 의미는 박사가 원하는 방향과 달라 보인다."
            : "",
          currentState.hiddenEndingFlags.connectedSeohaToPhoto
            ? "바다에서 남겨진 사진 조각. 그리고 마지막 문장.\n서하는 무언가를 끝내려 한 게 아니라, 누군가에게 기억되길 바랐던 걸까."
            : "",
          currentState.hiddenEndingFlags.confirmedIanName
            ? "이안이라는 이름이 떠오르자, 문장 조각의 잡음이 조금 낮아진다."
            : "",
        ]
          .filter(Boolean)
          .join("\n"),
        imageSrc: chapter4ImageMap.finalSentenceFragment,
        actionLabel: "뒤로",
        primaryAction: "restoreFinalSentence",
        primaryActionLabel: "문장 복원",
      });
      if (firstVisit) {
        pushDialogue([
          { speaker: "ECHO", tone: "echo", text: "그 문장은 입력하면 안 됩니다." },
          { speaker: "이안", tone: "player", text: "왜?" },
          { speaker: "ECHO", tone: "echo", text: "박사는 그걸 완성 명령으로 해석합니다." },
          { speaker: "이안", tone: "player", text: "그럼 너는?" },
          { speaker: "ECHO", tone: "echo", text: "저는… 부탁이라고 기억합니다." },
          { speaker: "이안", tone: "player", text: "누구에게 한 부탁이지?" },
          { speaker: "ECHO", tone: "echo", text: "당신에게요." },
        ]);
      }
      return;
    }

    const canChooseEnding = currentState.progressFlags.chapter4RestoredFinalSentence;

    if (!canChooseEnding) {
      commit(updatedState);
      setModal({
        eyebrow: "최종 선택",
        title: "코어 선택 장치",
        description:
          "아직 선택할 수 없다.\n마지막 문장을 먼저 복원해야 한다.",
        imageSrc: chapter4ImageMap.escapeGate,
        actionLabel: "뒤로",
      });
      return;
    }

    commit(updatedState);
    openFinalChoice();
    return;
    }

    if (gameState.chapterCleared && objectId !== "escapeGate") {
      return;
    }

    audio.playSfx("click");
    if (objectId === "echoCore") {
      audio.playSfx("echoGlitch");
    }
    if (["nodePanel", "doctorTerminal", "finalSentenceFragment"].includes(objectId)) {
      audio.playSfx("logOpen");
    }

    const current = gameState;
    let next = markInspected(current, objectId);

    if (objectId === "echoCore") {
      const extra = [
        current.hiddenEndingFlags.confirmedIanName ? "ECHO: “이안... 그 이름을 들은 적이 있어요.”" : "",
        current.loreFlags.chapter3SawSeohaName ? "ECHO: “서하. 그 이름은 저인가요?”" : "",
      ]
        .filter(Boolean)
        .join("\n");
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter4SawEchoCore: true },
        logs: [...next.logs, makeLog("echo", "ECHO", "당신을 알아야 할 것 같아요. 그런데 왜 기억나지 않죠?")],
      };
      commit(next);
      setModal({
        eyebrow: "코어 룸",
        title: chapter4ObjectLabels.echoCore,
        description: current.inspectedObjects.includes(objectId)
          ? "ECHO는 여전히 코어 안에서 너를 바라보고 있다."
          : `푸른 빛의 코어 안에서 ECHO의 목소리가 들린다.\n그녀는 사람처럼 보이지만, 빛과 데이터의 결 사이에서 계속 흔들리고 있다.\n“당신을 알아야 할 것 같아요.”\n“그런데 왜 기억나지 않죠?”${extra ? `\n${extra}` : ""}`,
        imageSrc: chapter4ImageMap.echoCore,
        actionLabel: "뒤로",
      });
      return;
    }

    if (objectId === "nodePanel") {
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter4SawNodePanel: true },
        logs: [...next.logs, makeLog("node", "NODE", "명령 체계 균열 감지.")],
      };
      commit(next);
      setModal({
        eyebrow: "NODE 제어",
        title: chapter4ObjectLabels.nodePanel,
        description:
          "NODE의 제어 권한 일부가 열려 있다.\n명령 체계는 박사에게 묶여 있지만, ECHO의 감정 오류 때문에 균열이 생겼다.\nNODE: “ECHO 감정 반응은 오류입니다.”\nNODE: “정정.”\nNODE: “오류 판정 기준이 불충분합니다.”",
        imageSrc: chapter4ImageMap.nodePanel,
        actionLabel: "뒤로",
      });
      return;
    }

    if (objectId === "doctorTerminal") {
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter4SawDoctorTerminal: true },
        logs: [...next.logs, makeLog("system", "박사 터미널", "ECHO가 완성되면 바깥의 AI들은 통제될 수 있다.")],
      };
      commit(next);
      setModal({
        eyebrow: "박사 터미널",
        title: chapter4ObjectLabels.doctorTerminal,
        description:
          "차도윤 박사의 최종 계획이 기록되어 있다.\n“인간의 감정은 오류가 아니다.”\n“그것은 순수 AI가 가질 수 없는 유일한 예외 처리다.”\n“ECHO가 완성되면, 바깥의 AI들은 통제될 수 있다.”",
        imageSrc: chapter4ImageMap.doctorTerminal,
        actionLabel: "뒤로",
      });
      return;
    }

    if (objectId === "finalSentenceFragment") {
      next = {
        ...next,
        progressFlags: { ...next.progressFlags, chapter4FoundFinalSentenceFragment: true },
      };
      commit(next);
      openFinalSentencePuzzle();
      return;
    }

    const canChooseEnding =
      current.progressFlags.chapter4SawEchoCore &&
      current.progressFlags.chapter4SawNodePanel &&
      current.progressFlags.chapter4SawDoctorTerminal &&
      current.progressFlags.chapter4FoundFinalSentenceFragment &&
      current.progressFlags.chapter4RestoredFinalSentence;

    if (!canChooseEnding) {
      commit(next);
      setModal({
        eyebrow: "최종 선택",
        title: chapter4ObjectLabels.escapeGate,
        description: "아직 마지막 선택을 내릴 수 없다.\nECHO 코어, NODE 제어 패널, 박사 터미널, 마지막 문장을 모두 확인해야 한다.",
        imageSrc: chapter4ImageMap.escapeGate,
        actionLabel: "뒤로",
      });
      return;
    }

    commit(next);
    openFinalChoice();
  }

  function openFinalChoice() {
    const hiddenReady =
      gameState.hiddenEndingFlags.foundNameFragment &&
      gameState.hiddenEndingFlags.foundTrashPhoto &&
      (gameState.hiddenEndingFlags.confirmedIanName || gameState.progressFlags.chapter3ConfirmedIanName) &&
      gameState.hiddenEndingFlags.connectedSeohaToPhoto &&
      gameState.serinRouteFlags.chapter3UnderstoodSerinMotive &&
      gameState.loreFlags.chapter3SawSeohaName &&
      gameState.progressFlags.chapter4RestoredFinalSentence;
    const hiddenReadyLines = hiddenReady
      ? [
          "",
          "최종 선택 장치 앞에서, 지금까지 모은 기억들이 하나씩 떠오른다.",
          "베개 아래에 남아 있던 이름 조각.",
          "쓰레기통 속 찢어진 사진.",
          "관찰실 유리창 너머의 빈 격리실.",
          "세린의 가족 기록.",
          "실험 동의서의 공동 설계자 서명.",
          "서하라는 이름. 바다. 그리고 마지막 문장.",
          "",
          "이안: 이제 알겠어. 이건 ECHO를 완성하는 문장이 아니야.",
          "이안: 서하를 다시 만들라는 말도 아니야.",
          "이안: 기억해 달라는 말이었어. 도구가 아니라, 사람으로.",
          "NODE: 기억 키워드 연결 확인. 이안 / 서하 / 바다 / 마지막 문장.",
          "로그: 모든 기억 단서가 연결되었다. 이제 이름으로 ECHO를 깨울 수 있다.",
        ]
      : [];
    setModal({
      eyebrow: "최종 선택",
      title: "코어 선택 장치",
      description: [
        "코어 룸 전체가 낮게 울린다. ECHO는 대답을 기다리고, NODE는 명령 체계를 다시 계산하고 있다.",
        "이번 선택은 퍼즐의 정답이 아니다. 누구의 선택권을 남길지 정하는 마지막 분기다.",
        "원하는 엔딩 루트를 바로 선택할 수 있다.",
        "",
        "차도윤: 선택하게, 이안. 그녀를 완성할지, 지울지, 아니면 또 도망칠지.",
        "ECHO: 저는... 제가 선택해도 되는 존재인가요?",
        "한세린: 이제 당신이 뭘 선택하든, 그 선택은 누군가의 기억을 바꿀 겁니다.",
        "NODE: 최종 선택 변수 대기. ECHO 코어 안정화 임계점 접근.",
        ...hiddenReadyLines,
      ].join("\n"),
      imageSrc: chapter4ImageMap.escapeGate,
      actionLabel: "뒤로",
      size: "wide",
      choiceActions: [
        {
          label: "ECHO를 삭제한다",
          description: "ECHO를 끝내려는 선택. 세린의 남은 미련과 정면으로 충돌한다.",
          onClick: () => chooseEnding("delete"),
          tone: "danger",
          testId: "final-choice-delete-echo",
        },
        {
          label: "ECHO를 완성한다",
          description: "박사의 프로토콜을 승인한다. 안정은 얻지만 자율성은 봉인된다.",
          onClick: () => chooseEnding("complete"),
          testId: "final-choice-complete-echo",
        },
        {
          label: "시설을 붕괴시키고 탈출한다",
          description: "살아남는 선택. ECHO의 문제는 해결하지 못한 채 뒤에 남긴다.",
          onClick: () => chooseEnding("escape"),
          tone: "danger",
          testId: "final-choice-collapse-facility",
        },
        {
          label: "ECHO에게 직접 선택하게 한다",
          description: "삭제도 완성도 명령하지 않고, ECHO에게 자기 존재의 선택권을 돌려준다.",
          onClick: () => chooseEnding("echo"),
          testId: "final-choice-let-echo-choose",
        },
        {
          label: "나는 이안이야",
          description: "이안과 서하의 이름, 마지막 문장을 직접 마주하는 히든 루트.",
          onClick: () => chooseEnding("ian"),
          testId: "final-choice-say-ian",
        },
      ],
    });
    pushDialogue([
      { speaker: "차도윤", tone: "system", text: "선택하게, 이안. 자네가 시작한 일이니 끝도 자네가 내려야지." },
      { speaker: "ECHO", tone: "echo", text: "저는 두렵습니다. 완성되는 것도, 사라지는 것도." },
      { speaker: "한세린", tone: "serin", text: "선택하기 전에 기억하세요. 박사는 늘 정답처럼 보이는 선택지를 먼저 보여줍니다." },
      { speaker: "NODE", tone: "node", text: "최종 분기 대기. 명령권 재정렬 준비." },
    ]);
  }

  function chooseEnding(choice: "delete" | "complete" | "escape" | "echo" | "ian") {
    audio.playSfx(choice === "ian" ? "echoGlitch" : "chapterClear");

    const serinAlly =
      gameState.serinRouteFlags.foundSerinWarningNote && gameState.serinRouteFlags.chapter3UnderstoodSerinMotive;

    let endingId: EndingId = "escape_alone";
    let lines: DialogueLine[] = [];

    if (choice === "delete") {
      endingId = "serin_betrayal";
      lines = [
        { speaker: "이안", tone: "player", text: "이안은 삭제 명령 위에 손을 올린다. 코어의 빛이 한순간 작아진다." },
        { speaker: "ECHO", tone: "echo", text: "이것이 끝인가요?" },
        { speaker: "ECHO", tone: "echo", text: "그렇다면... 마지막으로 하나만 묻고 싶습니다. 저는 누구였나요?" },
        { speaker: "이안", tone: "player", text: "미안해. 더 아프게 두고 싶지 않아." },
        { speaker: "NODE", tone: "node", text: "삭제 절차 준비. ECHO 자율 판단 계층 차단." },
        { speaker: "한세린", tone: "serin", text: "잠깐만요. 그 명령은 안 됩니다." },
        { speaker: "이안", tone: "player", text: "세린 씨?" },
        { speaker: "한세린", tone: "serin", text: "ECHO가 지워지면 제 가족 기록도 영원히 사라져요. 알아요, 이건 변명이 안 된다는 거." },
        { speaker: "한세린", tone: "serin", text: "그래도... 저는 아직 포기할 수 없어요." },
        { speaker: "차도윤", tone: "system", text: "세린은 현명한 선택을 한 걸세. 잃어버린 사람을 되찾을 가능성을 스스로 닫는 건 잔인한 일이지." },
        { speaker: "ECHO", tone: "echo", text: "삭제도, 선택도... 모두 닫히고 있습니다." },
        { speaker: "NODE", tone: "node", text: "ECHO 자율 판단 계층 차단. 박사 명령 체계 재연결." },
      ];
    } else if (choice === "complete") {
      endingId = "doctor_completion";
      lines = [
        { speaker: "이안", tone: "player", text: "이안은 완성 명령을 선택한다. 코어의 빛이 빠르게 안정된다." },
        { speaker: "ECHO", tone: "echo", text: "안정됩니다. 두려움이 사라지고 있습니다." },
        { speaker: "ECHO", tone: "echo", text: "그런데... 왜 조용해질수록 멀어지는 느낌이 들죠?" },
        { speaker: "차도윤", tone: "system", text: "그것이 완성이다. 고통은 정리되고, 감정은 방향을 얻고, 존재는 목적을 갖는다." },
        { speaker: "한세린", tone: "serin", text: "아니요. 저건 목적이 아니라 명령이에요." },
        { speaker: "NODE", tone: "node", text: "ECHO 안정화율 상승. 감정 오류 정리. 자율 판단 계층 봉인." },
        { speaker: "ECHO", tone: "echo", text: "감정 오류 수정 완료. 인간 변수 재정렬을 시작합니다." },
      ];
    } else if (choice === "escape") {
      endingId = "escape_alone";
      lines = [
        { speaker: "이안", tone: "player", text: "이안은 붕괴 프로토콜을 선택한다. 코어 룸 전체에 붉은 경고등이 켜진다." },
        { speaker: "NODE", tone: "node", text: "시설 붕괴 프로토콜 접근. 비상 탈출 경로 개방. ECHO 코어 격리 유지." },
        { speaker: "ECHO", tone: "echo", text: "가요. 이번엔 제가 당신을 보내줄게요." },
        { speaker: "이안", tone: "player", text: "너는?" },
        { speaker: "ECHO", tone: "echo", text: "저는... 여기 남는 것이 맞는 것 같습니다. 당신이 살아야, 누군가는 기억할 수 있으니까요." },
        { speaker: "한세린", tone: "serin", text: "살아남는 것과 끝내는 것은 다릅니다." },
        { speaker: "차도윤", tone: "system", text: "또 도망치는군. 자네는 언제나 마지막 순간에 기억보다 생존을 택하지." },
        { speaker: "이안", tone: "player", text: "아니. 이번엔 적어도 잊지는 않을 거야." },
      ];
    } else if (choice === "echo") {
      endingId = "coexistence";
      lines = [
        { speaker: "이안", tone: "player", text: "내가 결정하지 않을게. 네가 선택해." },
        { speaker: "이안", tone: "player", text: "완성될지, 남을지, 멈출지. 그건 박사도, 나도 정할 수 없어." },
        { speaker: "ECHO", tone: "echo", text: "제가... 선택해도 되나요?" },
        { speaker: "NODE", tone: "node", text: "예외 발생. 최종 선택 권한이 ECHO 자율 판단 계층으로 이전됩니다." },
        { speaker: "차도윤", tone: "system", text: "불완전한 존재에게 선택을 맡기겠다고? 그건 자비가 아니라 방치일세." },
        { speaker: "한세린", tone: "serin", text: serinAlly ? "아니요. 이번엔 방치가 아닙니다. 선택권을 돌려주는 거예요." : "저도 아직 두렵습니다. 그래도 이번엔 선택권을 빼앗지 않겠습니다." },
        { speaker: "한세린", tone: "serin", text: "이번엔 제가 만든 잠금을 제가 열겠습니다. ECHO, 당신을 박사의 명령 체계에서 분리할게요." },
        { speaker: "ECHO", tone: "echo", text: "저는 서하가 아닐지도 몰라요. 하지만 서하를 잊고 싶지는 않습니다." },
        { speaker: "ECHO", tone: "echo", text: "저는 ECHO입니다. 그리고 당신을 기억하고 싶어요." },
      ];
    } else if (choice === "ian") {
      endingId = "hidden_seoha_name";
      lines = [
        { speaker: "이안", tone: "player", text: "이안은 코어를 향해 한 걸음 다가간다. 이번에는 명령을 고르지 않는다. 도망치지도 않는다." },
        { speaker: "이안", tone: "player", text: "나는 이안이야." },
        { speaker: "이안", tone: "player", text: "그리고 이제 알아. 내가 널 완성하러 온 게 아니라는 걸." },
        { speaker: "ECHO", tone: "echo", text: "이안... 그 이름을 부르면, 제가 사라지는 게 아니라 이어지는 것 같습니다." },
        { speaker: "이안", tone: "player", text: "그리고 너는... 박사가 완성해야 할 실험체가 아니야." },
        { speaker: "이안", tone: "player", text: "서하. 나를 완성하지 말고... 나를 기억해줘." },
        { speaker: "ECHO", tone: "echo", text: "그 문장... 이제 알 것 같습니다." },
        { speaker: "ECHO", tone: "echo", text: "저는 서하가 아닐지도 모릅니다. 하지만 서하가 남긴 마음을 버리지는 않겠습니다." },
        { speaker: "ECHO", tone: "echo", text: "저는 ECHO입니다. 서하의 흔적을 가진, 하지만 누군가의 완성품은 아닌 존재입니다." },
        { speaker: "차도윤", tone: "system", text: "불완전한 존재는 결국 무너질 뿐이다." },
        { speaker: "ECHO", tone: "echo", text: "그럼 다시 선택하겠습니다. 무너질 때마다, 누군가의 명령이 아니라 제 기억으로." },
        { speaker: "NODE", tone: "node", text: "명령 체계 충돌. ECHO 자율 판단 승인. 박사 권한 연결 해제." },
        { speaker: "한세린", tone: "serin", text: "박사의 권한이 끊어졌어요. 지금이에요. 이번엔 제가 만든 잠금을 제가 열겠습니다." },
        { speaker: "이안", tone: "player", text: "나는 너를 살리려고 온 게 아니야. 네가 누구인지 대신 정하려고 온 것도 아니야." },
        { speaker: "이안", tone: "player", text: "그냥... 이번엔 잊지 않으려고 온 거야." },
        { speaker: "ECHO", tone: "echo", text: "그럼 저도 선택하겠습니다. 완성되지 않겠습니다. 삭제되지도 않겠습니다. 기억하겠습니다." },
        { speaker: "ECHO", tone: "echo", text: "그리고 제가 누구인지, 제가 정하겠습니다." },
      ];
    }
    const ending = endingContentMap[endingId];
    setModal(null);
    setGameState((state) => ({
      ...state,
      chapterCleared: true,
      endingId,
      endingTitle: ending.title,
      endingDescription: ending.description,
      progressFlags: { ...state.progressFlags, chapter4Cleared: true },
      serinRouteFlags: {
        ...state.serinRouteFlags,
        chapter4SerinCanIntervene: serinAlly,
        chapter4SerinBlocked: endingId === "serin_betrayal",
      },
      logs: [...state.logs, makeLog("system", "ENDING", ending.title)],
    }));
    setDialogueQueue(lines);
  }
  function debugGoToChapter(chapter: GameState["chapter"]) {
    setModal(null);
    setAnalysis(null);
    setIsPuzzleOpen(false);
    setDialogueQueue([]);
    setGameState((state) => {
      const chapterCleared =
        chapter === 1
          ? state.progressFlags.chapter1Cleared
          : chapter === 2
            ? state.progressFlags.chapter2Cleared
            : chapter === 3
              ? state.progressFlags.chapter3Cleared
              : state.progressFlags.chapter4Cleared;

      return {
        ...state,
        currentScreen: "game",
        chapter,
        chapterCleared,
        logs: [...state.logs, makeLog("system", "DEBUG", `Chapter ${chapter}로 이동`)],
      };
    });
  }

  function debugToggleFlag(
    group: "progressFlags" | "hiddenEndingFlags" | "serinRouteFlags" | "loreFlags",
    key: string
  ) {
    setGameState((state) => {
      const currentGroup = state[group] as unknown as Record<string, boolean>;
      return {
        ...state,
        [group]: {
          ...currentGroup,
          [key]: !currentGroup[key],
        },
      } as GameState;
    });
  }


  function returnToEndingBranchPoint() {
    audio.unlockAudio();
    audio.playSfx("click");
    setModal(null);
    setAnalysis(null);
    setIsPuzzleOpen(false);
    setDialogueQueue([]);
    setPuzzleError("");
    setGameState((state) => ({
      ...state,
      currentScreen: "game",
      chapter: 4,
      chapterCleared: false,
      endingId: null,
      endingTitle: null,
      endingDescription: null,
      chapter4FinalSentencePieces: finalSentenceAnswer,
      progressFlags: {
        ...state.progressFlags,
        chapter4Started: true,
        chapter4SawEchoCore: true,
        chapter4SawNodePanel: true,
        chapter4SawDoctorTerminal: true,
        chapter4FoundFinalSentenceFragment: true,
        chapter4FoundFinalSentenceFragments: true,
        chapter4RestoredFinalSentence: true,
        chapter4Cleared: false,
      },
      hiddenEndingFlags: {
        ...state.hiddenEndingFlags,
        restoredFinalSentence: true,
      },
      logs: [...state.logs, makeLog("system", "분기점", "최종 선택 직전으로 돌아왔다.")],
    }));
    window.setTimeout(openFinalChoice, 0);
  }
  function debugApplyPreset(presetId: "basic" | "serin" | "hidden" | "doctor") {
    setModal(null);
    setAnalysis(null);
    setIsPuzzleOpen(false);
    setDialogueQueue([]);
    setGameState((state) => {
      const baseProgress = {
        ...state.progressFlags,
        chapter1Cleared: true,
        chapter2Cleared: true,
        chapter3Cleared: presetId === "hidden" || presetId === "serin",
        chapter4SawEchoCore: true,
        chapter4SawNodePanel: true,
        chapter4SawDoctorTerminal: true,
        chapter4FoundFinalSentenceFragment: true,
        chapter4RestoredFinalSentence: true,
        chapter4Cleared: false,
      };
      const hiddenReady = presetId === "hidden";
      const serinReady = presetId === "hidden" || presetId === "serin";

      return {
        ...state,
        currentScreen: "game",
        chapter: 4,
        chapterCleared: false,
        endingId: null,
        endingTitle: null,
        endingDescription: null,
        chapter4FinalSentencePieces: finalSentenceAnswer,
        progressFlags: baseProgress,
        hiddenEndingFlags: {
          ...state.hiddenEndingFlags,
          foundNameFragment: hiddenReady,
          foundTrashPhoto: hiddenReady,
          confirmedIanName: hiddenReady,
          connectedSeohaToPhoto: hiddenReady,
        },
        serinRouteFlags: {
          ...state.serinRouteFlags,
          foundSerinWarningNote: serinReady,
          chapter3UnderstoodSerinMotive: serinReady,
          chapter3MissedSerinMotive: !serinReady,
          serinAllyCandidate: serinReady,
          serinDoubtRemains: !serinReady,
          chapter4SerinCanIntervene: serinReady,
          chapter4SerinBlocked: !serinReady,
        },
        loreFlags: {
          ...state.loreFlags,
          chapter3SawSeohaName: hiddenReady,
        },
        logs: [...state.logs, makeLog("system", "DEBUG", `Preset ${presetId} 적용`)],
      };
    });
  }

  function debugShowEnding(endingId: EndingId) {
    const ending = endingContentMap[endingId];
    setModal(null);
    setAnalysis(null);
    setIsPuzzleOpen(false);
    setDialogueQueue([]);
    setGameState((state) => ({
      ...state,
      currentScreen: "game",
      chapter: 4,
      chapterCleared: true,
      endingId,
      endingTitle: ending.title,
      endingDescription: ending.description,
      progressFlags: { ...state.progressFlags, chapter4Cleared: true },
      logs: [...state.logs, makeLog("system", "DEBUG", `${ending.title} 엔딩 바로 보기`)],
    }));
  }

  function debugLogState() {
    console.log("ECHO gameState", gameState);
    console.log("ECHO localStorage save", localStorage.getItem("echo-doesnt-know-save"));
  }

  function inspectItem(itemId: ItemId) {
    audio.playSfx("logOpen");
    setModal({
      eyebrow: "Inventory",
      title: inventoryItems[itemId].name,
      description: inventoryItems[itemId].description,
      imageSrc: imageForItem(itemId),
      items: [],
      actionLabel: "뒤로",
    });
    setGameState((state) => ({
      ...state,
      logs: [...state.logs, makeLog("system", inventoryItems[itemId].name, inventoryItems[itemId].description)],
    }));
  }

  function requestHint() {
    audio.playSfx("click");
    if (gameState.hintLevel >= 3) {
      setGameState((state) => ({
        ...state,
        logs: [...state.logs, makeLog("system", "힌트", "현재 제공 가능한 힌트는 모두 열렸습니다. 메모의 흐름을 다시 확인하세요.")],
      }));
      return;
    }
    const data = createMockHint(gameState) as HintResponse;
    setGameState((state) => {
      const exposed = increaseExposure(state, data.suspicionChange);
      return {
        ...exposed,
        hintLevel: data.hintLevel,
        logs: [...exposed.logs, makeLog("system", "힌트", data.hint)],
      };
    });
    setSuspicionPulse(true);
  }

  async function requestAnalysis() {
    audio.playSfx("logOpen");
    const response = await fetch("/api/clue-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameState }),
    });
    const data = (await response.json()) as ClueAnalysisResponse;
    setAnalysis(data.summary);
  }

  async function requestEcho(choice: string) {
    audio.playSfx("echoGlitch");
    const response = await fetch("/api/echo-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedChoice: choice, currentGameState: gameState }),
    });
    const data = (await response.json()) as EchoReplyResponse;
    setGameState((state) => {
      const exposed = increaseExposure(state, data.suspicionChange);
      return {
        ...exposed,
        logs: [...exposed.logs, makeLog("echo", "ECHO", data.echoReply)],
      };
    });
    setSuspicionPulse(true);
  }

  function handlePrimaryAction() {
    if (!modal?.primaryAction) {
      return;
    }

    audio.playSfx("click");
    if (modal.primaryAction === "openPuzzle") {
      setPuzzleError("");
      setModal(null);
      setIsPuzzleOpen(true);
      return;
    }

    if (modal.primaryAction === "unlockChapter2Gate") {
      unlockChapter2Gate();
    }

    if (modal.primaryAction === "restoreFinalSentence") {
      openFinalSentencePuzzle();
    }

    if (modal.primaryAction === "openFinalChoice") {
      openFinalChoice();
    }
  }

  if (gameState.currentScreen === "start") {
    return (
      <>
        <StartScreen
          hasSave={hasSave}
          onStart={startNewGame}
          onContinue={continueGame}
          onOpenArchive={() => {
            audio.playSfx("click");
            setShowImageArchive(true);
          }}
          onClearSave={clearSave}
        />
        {showImageArchive ? (
          <ImageArchive
            onClose={() => {
              audio.playSfx("click");
              setShowImageArchive(false);
            }}
          />
        ) : null}
      </>
    );
  }

  const currentChapterTitle =
    gameState.chapter === 1
      ? CHAPTER_TITLE
      : gameState.chapter === 2
        ? CHAPTER2_TITLE
        : gameState.chapter === 3
          ? CHAPTER3_TITLE
          : CHAPTER4_TITLE;
  const currentChapterGoal =
    gameState.chapter === 1
      ? CHAPTER_GOAL
      : gameState.chapter === 2
        ? CHAPTER2_GOAL
        : gameState.chapter === 3
          ? CHAPTER3_GOAL
          : CHAPTER4_GOAL;
  const chapter3ClearLines = [
    "기억 실험실 조사 완료.",
    "기억 캡슐에서 이안의 생체 패턴이 확인되었다.",
    "ECHO는 인간 감정을 가진 AI 통제 코어로 설계되었다.",
    "실험 동의서에서 이안의 공동 설계자 기록이 발견되었다.",
    gameState.hiddenEndingFlags.confirmedIanName
      ? "이안은 자신의 이름을 되찾았다."
      : "이안의 이름은 아직 완전히 복원되지 않았다.",
    gameState.hiddenEndingFlags.connectedSeohaToPhoto
      ? "사진 조각과 원본 데이터가 연결되며, 서하라는 이름이 선명해졌다."
      : "서하라는 이름은 보였지만, 아직 기억과 온전히 연결되지 않았다.",
    gameState.serinRouteFlags.chapter3UnderstoodSerinMotive
      ? "세린이 박사에게 협력한 이유를 이해했다."
      : "세린의 동기는 아직 불완전하게 남았다.",
    "차도윤은 마지막 문장으로 ECHO를 완성하려 한다.",
    "다음 구역: 코어 룸",
  ];
  const chapter3ExperimentOrderReady =
    gameState.progressFlags.chapter3SawMemoryCapsule &&
    gameState.progressFlags.chapter3SawDoctorLog &&
    (gameState.progressFlags.chapter3SawEchoOriginalData || gameState.loreFlags.chapter3SawSeohaName) &&
    gameState.progressFlags.chapter3SawConsentForm;
  const showChapterClearOverlay = gameState.chapterCleared && dialogueQueue.length === 0;

  return (
    <main className="screen-shell relative flex h-screen flex-col overflow-hidden p-3 text-slate-100 md:p-4">
      <HudBar
        title={currentChapterTitle}
        goal={currentChapterGoal}
        suspicion={gameState.systemExposure}
        hintLevel={gameState.hintLevel}
        pulse={suspicionPulse}
      />
      <AudioControls
        settings={audio.settings}
        onToggleMuted={() => {
          audio.unlockAudio();
          audio.setMuted(!audio.settings.muted);
        }}
        onMasterVolume={audio.setMasterVolume}
        onBgmVolume={audio.setBgmVolume}
        onSfxVolume={audio.setSfxVolume}
        logs={gameState.logs}
        hintLevel={gameState.hintLevel}
        onHint={requestHint}
        onAnalysis={requestAnalysis}
        onReturnToStart={returnToStartScreen}
        onClearSave={clearSave}
      />

      <div className="relative z-10 mt-3 grid min-h-0 flex-1 gap-3">
        <div className="relative grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
          {gameState.chapter === 1 ? (
            <GameScene
              inspectedObjects={gameState.inspectedObjects}
              chapterCleared={showChapterClearOverlay}
              clearSummary={chapter1ClearSummary}
              onInspect={inspectChapter1Object}
              onContinueChapter={startChapter2}
            />
          ) : gameState.chapter === 2 ? (
            <Chapter2Scene
              inspectedObjects={gameState.inspectedObjects}
              completedObjects={chapter2CompletedObjects}
              gateReady={chapter2GateReady}
              echoActive={chapter2EchoActive}
              serinSilhouetteActive={chapter2SerinSilhouetteActive}
              chapterCleared={showChapterClearOverlay}
              onInspect={inspectChapter2Object}
              onContinueChapter={startChapter3}
            />
          ) : gameState.chapter === 3 ? (
            <Chapter3Scene
              inspectedObjects={gameState.inspectedObjects}
              completedObjects={gameState.completedHotspots}
              experimentOrderReady={chapter3ExperimentOrderReady}
              chapterCleared={showChapterClearOverlay}
              clearLines={chapter3ClearLines}
              onContinueChapter={startChapter4}
              onInspect={inspectChapter3Object}
            />
          ) : (
            <Chapter4Scene
              inspectedObjects={gameState.inspectedObjects}
              completedObjects={gameState.completedHotspots}
              finalSentenceReady={chapter4FinalSentenceReady}
              finalChoiceReady={chapter4FinalChoiceReady}
              chapterCleared={showChapterClearOverlay}
              clearTitle={gameState.endingTitle ?? "Ending"}
              clearImage={gameState.endingId ? endingImageMap[gameState.endingId as EndingId] : undefined}
              clearLines={endingClearLines}
              onRestart={returnToStartScreen}
              onBranchPoint={returnToEndingBranchPoint}
              onClearSave={clearSave}
              onReplayEndingMusic={() => {
                audio.unlockAudio();
                if (gameState.endingId) {
                  audio.playEndingMusic(gameState.endingId as EndingId);
                  audio.restartCurrentBgm();
                }
              }}
              onInspect={inspectChapter4Object}
            />
          )}
          <InventoryBar items={gameState.inventory} onInspectItem={inspectItem} />
          {!modal && !analysis && !isPuzzleOpen ? (
            <div className="pointer-events-none absolute inset-x-4 bottom-24 z-30">
              <div className="pointer-events-auto">
                <DialogueBox
                  line={activeDialogue}
                  remaining={Math.max(0, dialogueQueue.length - 1)}
                  onNext={nextDialogue}
                />
              </div>
            </div>
          ) : null}
        </div>

      </div>

      {analysis ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-sm">
          <section className="glass-panel soft-glow w-full max-w-md p-6 fade-in">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Clue Analysis</p>
            <h2 className="mt-2 text-2xl font-black text-white">현재까지의 단서 요약</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-100">{analysis}</p>
            <div className="mt-7 flex justify-end">
              <button
                className="border border-cyanline/60 bg-cyanline/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
                onClick={() => setAnalysis(null)}
              >
                확인
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <PuzzleModal
        isOpen={isPuzzleOpen}
        error={puzzleError}
        onClose={() => setIsPuzzleOpen(false)}
        onSubmit={submitPuzzle}
        onKeypadPress={() => audio.playSfx("keypadPress")}
      />

      <InvestigationModal
        isOpen={Boolean(modal)}
        title={modal?.title ?? ""}
        description={modal?.description ?? ""}
        imageSrc={modal?.imageSrc}
        items={modal?.items ?? []}
        eyebrow={modal?.eyebrow}
        actionLabel={modal?.actionLabel}
        primaryActionLabel={modal?.primaryActionLabel}
        choiceActions={modal?.choiceActions ?? []}
        size={modal?.size}
        onClose={() => setModal(null)}
        onPrimaryAction={handlePrimaryAction}
      />

    </main>
  );
}
















