import { inventoryItems } from "@/data/chapter1";
import type { GameLog, GameState, ItemId, ObjectId } from "@/types/game";

export const initialLogs: GameLog[] = [
  {
    id: "log-initial-node",
    tone: "node",
    speaker: "NODE",
    message: "사용자 식별 실패. 기억 손상 프로토콜 확인.",
  },
  {
    id: "log-initial-serin",
    tone: "serin",
    speaker: "한세린",
    message: "이 기록은 공식 실험 로그가 아닙니다. 제가 틀렸다면 좋겠습니다.",
  },
];

export function createInitialGameState(): GameState {
  return {
    currentScreen: "start",
    chapter: 1,
    inventory: [],
    inspectedObjects: [],
    completedHotspots: [],
    solvedPuzzles: [],
    suspicion: 0,
    systemExposure: 0,
    hintLevel: 0,
    chapterCleared: false,
    dialogueNodeId: null,
    chapter1PasswordAttempts: 0,
    chapter2PowerSequence: [],
    chapter2SelectedRoute: null,
    chapter3ExperimentOrder: [],
    chapter4FinalSentencePieces: [],
    endingId: null,
    endingTitle: null,
    endingDescription: null,
    progressFlags: {
      foundDeskMemo: false,
      foundAccessCard: false,
      talkedToSerinAtDoor: false,
      serinIdentified: true,
      unlockedDoorPanel: false,
      chapter1Cleared: false,
      chapter2Started: false,
      chapter2SawObservationWindow: false,
      chapter2SawSurveillanceRoom: false,
      chapter2SawCctvGrid: false,
      chapter2FoundBlindSpot: false,
      chapter2PowerRestored: false,
      chapter2RestoredSerinComms: false,
      chapter2MetEcho: false,
      chapter2GateUnlocked: false,
      chapter2Cleared: false,
      chapter3Started: false,
      chapter3SawMemoryCapsule: false,
      chapter3FoundBioPattern: false,
      chapter3SawDoctorLog: false,
      chapter3LearnedEchoPurpose: false,
      chapter3SawSerinFamilyRecord: false,
      chapter3SawEchoOriginalData: false,
      chapter3SawConsentForm: false,
      chapter3ConfirmedIanName: false,
      chapter3LearnedIanCoDesigner: false,
      chapter3RestoredExperimentOrder: false,
      chapter3DoctorRevealed: false,
      chapter3Cleared: false,
      chapter4Started: false,
      chapter4SawEchoCore: false,
      chapter4SawNodePanel: false,
      chapter4SawDoctorTerminal: false,
      chapter4FoundFinalSentenceFragment: false,
      chapter4FoundFinalSentenceFragments: false,
      chapter4RestoredFinalSentence: false,
      chapter4Cleared: false,
    },
    hiddenEndingFlags: {
      foundNameFragment: false,
      foundTrashPhoto: false,
      confirmedIanName: false,
      connectedSeohaToPhoto: false,
      restoredFinalSentence: false,
    },
    serinRouteFlags: {
      foundSerinWarningNote: false,
      chapter2TalkedWithSerin: false,
      chapter2TalkedAboutFamilyRecord: false,
      chapter2SawSerinSilhouette: false,
      chapter3UnderstoodSerinMotive: false,
      chapter3MissedSerinMotive: false,
      serinAllyCandidate: false,
      serinDoubtRemains: false,
      chapter4SerinCanIntervene: false,
      chapter4SerinBlocked: false,
    },
    loreFlags: {
      sawCeilingLight: false,
      sawLockedEchoLog: false,
      chapter2LearnedObservation: false,
      chapter2SawObservationLog: false,
      chapter2SawOwnObservationFeed: false,
      chapter2EchoReactedToName: false,
      chapter2EchoReactedToSea: false,
      chapter2EchoManifested: false,
      chapter3SawSeohaName: false,
      chapter3LearnedDoctorPhilosophy: false,
      chapter4ConfrontedEchoCore: false,
      chapter4LearnedNodeControl: false,
      chapter4LearnedDoctorFinalProtocol: false,
      chapter4UnderstoodFinalSentenceMeaning: false,
    },
    logs: initialLogs,
  };
}

export function normalizeGameState(raw: Partial<GameState> | null): GameState | null {
  if (!raw) {
    return null;
  }

  const initial = createInitialGameState();
  const migratedInventory = (raw.inventory ?? []).map(migrateItemId).filter(Boolean) as ItemId[];
  const migratedObjects = (raw.inspectedObjects ?? []).filter(isObjectId);
  const chapter = raw.chapter === 4 ? 4 : raw.chapter === 3 ? 3 : raw.chapter === 2 ? 2 : 1;
  const chapterCleared =
    chapter === 4
      ? raw.progressFlags?.chapter4Cleared ?? raw.chapterCleared ?? false
      : chapter === 3
        ? raw.progressFlags?.chapter3Cleared ?? raw.chapterCleared ?? false
        : chapter === 2
          ? raw.progressFlags?.chapter2Cleared ?? raw.chapterCleared ?? false
          : raw.progressFlags?.chapter1Cleared ?? raw.chapterCleared ?? false;

  return {
    ...initial,
    ...raw,
    chapter,
    inventory: [...new Set(migratedInventory)],
    inspectedObjects: [...new Set(migratedObjects)],
    completedHotspots: [...new Set((raw.completedHotspots ?? migratedObjects).filter(isObjectId))],
    solvedPuzzles: raw.solvedPuzzles ?? [],
    suspicion: raw.systemExposure ?? raw.suspicion ?? 0,
    systemExposure: raw.systemExposure ?? raw.suspicion ?? 0,
    hintLevel: raw.hintLevel ?? 0,
    chapterCleared,
    dialogueNodeId: raw.dialogueNodeId ?? null,
    chapter1PasswordAttempts: raw.chapter1PasswordAttempts ?? 0,
    chapter2PowerSequence: raw.chapter2PowerSequence ?? [],
    chapter2SelectedRoute: raw.chapter2SelectedRoute ?? null,
    chapter3ExperimentOrder: raw.chapter3ExperimentOrder ?? [],
    chapter4FinalSentencePieces: raw.chapter4FinalSentencePieces ?? [],
    endingId: raw.endingId ?? null,
    endingTitle: raw.endingTitle ?? null,
    endingDescription: raw.endingDescription ?? null,
    progressFlags: {
      ...initial.progressFlags,
      ...raw.progressFlags,
      foundDeskMemo: raw.progressFlags?.foundDeskMemo ?? migratedInventory.includes("torn_memo_a"),
      foundAccessCard: raw.progressFlags?.foundAccessCard ?? migratedInventory.includes("access_card"),
      chapter1Cleared: raw.progressFlags?.chapter1Cleared ?? (chapter === 1 ? raw.chapterCleared ?? false : true),
      chapter2FoundBlindSpot: raw.progressFlags?.chapter2FoundBlindSpot ?? false,
      chapter2Cleared: raw.progressFlags?.chapter2Cleared ?? (chapter > 2 ? true : chapter === 2 ? raw.chapterCleared ?? false : false),
      chapter3Cleared: raw.progressFlags?.chapter3Cleared ?? (chapter > 3 ? true : chapter === 3 ? raw.chapterCleared ?? false : false),
      chapter4Cleared: raw.progressFlags?.chapter4Cleared ?? (chapter === 4 ? raw.chapterCleared ?? false : false),
    },
    hiddenEndingFlags: {
      ...initial.hiddenEndingFlags,
      ...raw.hiddenEndingFlags,
      foundNameFragment: raw.hiddenEndingFlags?.foundNameFragment ?? migratedInventory.includes("name_fragment"),
      foundTrashPhoto: raw.hiddenEndingFlags?.foundTrashPhoto ?? migratedInventory.includes("torn_photo_fragment"),
    },
    serinRouteFlags: {
      ...initial.serinRouteFlags,
      ...raw.serinRouteFlags,
      foundSerinWarningNote:
        raw.serinRouteFlags?.foundSerinWarningNote ?? migratedInventory.includes("serin_warning_note"),
    },
    loreFlags: {
      ...initial.loreFlags,
      ...raw.loreFlags,
    },
    logs: raw.logs?.length ? raw.logs : initial.logs,
  };
}

export function makeLog(tone: GameLog["tone"], speaker: string, message: string): GameLog {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tone,
    speaker,
    message,
  };
}

export function hasItem(state: GameState, itemId: ItemId): boolean {
  return state.inventory.includes(itemId);
}

export function addItem(state: GameState, itemId: ItemId): GameState {
  if (state.inventory.includes(itemId)) {
    return state;
  }

  return {
    ...state,
    inventory: [...state.inventory, itemId],
    logs: [...state.logs, makeLog("system", "획득", `${inventoryItems[itemId].name}이 인벤토리에 추가됐다.`)],
  };
}

export function markInspected(state: GameState, objectId: ObjectId): GameState {
  if (state.inspectedObjects.includes(objectId)) {
    return state;
  }

  return {
    ...state,
    inspectedObjects: [...state.inspectedObjects, objectId],
    completedHotspots: [...new Set([...state.completedHotspots, objectId])],
  };
}

function migrateItemId(itemId: string): ItemId | null {
  const map: Record<string, ItemId> = {
    memoA: "torn_memo_a",
    memoB: "torn_photo_fragment",
    accessCard: "access_card",
    idTag: "name_fragment",
    torn_memo_a: "torn_memo_a",
    access_card: "access_card",
    name_fragment: "name_fragment",
    torn_photo_fragment: "torn_photo_fragment",
    serin_warning_note: "serin_warning_note",
  };

  return map[itemId] ?? null;
}

function isObjectId(objectId: string): objectId is ObjectId {
  return [
    "bed",
    "underBed",
    "desk",
    "drawer",
    "monitor",
    "trash",
    "doorPanel",
    "camera",
    "serinComms",
    "observationWindow",
    "surveillanceRoom",
    "cctvGrid",
    "powerPanel",
    "communicationConsole",
    "echoHologram",
    "serinSilhouette",
    "securityGate",
    "memoryCapsule",
    "doctorLog",
    "serinFamilyRecord",
    "echoOriginalData",
    "consentForm",
    "experimentOrder",
    "echoCore",
    "nodePanel",
    "doctorTerminal",
    "finalSentenceFragment",
    "finalSentencePuzzle",
    "coreChoiceTerminal",
    "escapeGate",
  ].includes(objectId);
}

