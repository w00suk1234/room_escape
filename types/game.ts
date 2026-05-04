export type Screen = "start" | "prologue" | "game";

export type Chapter = 1 | 2 | 3 | 4;

export type Chapter1ObjectId =
  | "bed"
  | "underBed"
  | "desk"
  | "drawer"
  | "monitor"
  | "trash"
  | "doorPanel"
  | "camera"
  | "serinComms";

export type Chapter2ObjectId =
  | "observationWindow"
  | "surveillanceRoom"
  | "cctvGrid"
  | "powerPanel"
  | "communicationConsole"
  | "echoHologram"
  | "serinSilhouette"
  | "securityGate";

export type Chapter3ObjectId =
  | "memoryCapsule"
  | "doctorLog"
  | "serinFamilyRecord"
  | "echoOriginalData"
  | "consentForm"
  | "experimentOrder";

export type Chapter4ObjectId =
  | "echoCore"
  | "nodePanel"
  | "doctorTerminal"
  | "finalSentenceFragment"
  | "finalSentencePuzzle"
  | "coreChoiceTerminal"
  | "escapeGate";

export type ObjectId = Chapter1ObjectId | Chapter2ObjectId | Chapter3ObjectId | Chapter4ObjectId;

export type ItemId =
  | "torn_memo_a"
  | "access_card"
  | "name_fragment"
  | "torn_photo_fragment"
  | "serin_warning_note";

export type Chapter1ImageKey =
  | "roomMain"
  | "bedPillowHint"
  | "ceilingCctv"
  | "deskNote"
  | "doorPanelClose"
  | "doorPasswordHint"
  | "drawerKeycard"
  | "trashClose"
  | "underBedMemo"
  | "wallMonitor"
  | "monitorEchoLog";

export type Chapter2ImageKey =
  | "chapter2MainCorridor"
  | "observationWindowDetail"
  | "surveillanceRoomDetail"
  | "cctvGridDisplay"
  | "powerControlPanel"
  | "communicationConsole"
  | "echoHologramEvent"
  | "serinSilhouette"
  | "securityGateDetail";

export type Chapter3ImageKey =
  | "chapter3MainLab"
  | "memoryCapsule"
  | "doctorLog"
  | "serinFamilyRecord"
  | "echoOriginalData"
  | "consentForm";

export type Chapter4ImageKey =
  | "chapter4CoreRoom"
  | "echoCore"
  | "nodePanel"
  | "doctorTerminal"
  | "finalSentenceFragment"
  | "finalSentencePuzzle"
  | "coreChoiceTerminal"
  | "escapeGate";

export type ImageKey = Chapter1ImageKey | Chapter2ImageKey | Chapter3ImageKey | Chapter4ImageKey;

export type LogTone = "system" | "serin" | "node" | "echo" | "player";

export interface InventoryItem {
  id: ItemId;
  name: string;
  description: string;
}

export interface HotspotConfig<TId extends ObjectId = ObjectId> {
  id: TId;
  x: number;
  y: number;
  label: string;
  type: "progress" | "memory" | "serin" | "lore" | "echo";
  imageKey: ImageKey;
  stateKey?: string;
  zIndex?: number;
}

export interface GameLog {
  id: string;
  tone: LogTone;
  speaker: string;
  message: string;
}

export interface ProgressFlags {
  foundDeskMemo: boolean;
  foundAccessCard: boolean;
  talkedToSerinAtDoor: boolean;
  serinIdentified: boolean;
  unlockedDoorPanel: boolean;
  chapter1Cleared: boolean;
  chapter2Started: boolean;
  chapter2SawObservationWindow: boolean;
  chapter2SawSurveillanceRoom: boolean;
  chapter2SawCctvGrid: boolean;
  chapter2FoundBlindSpot: boolean;
  chapter2PowerRestored: boolean;
  chapter2RestoredSerinComms: boolean;
  chapter2MetEcho: boolean;
  chapter2GateUnlocked: boolean;
  chapter2Cleared: boolean;
  chapter3Started: boolean;
  chapter3SawMemoryCapsule: boolean;
  chapter3FoundBioPattern: boolean;
  chapter3SawDoctorLog: boolean;
  chapter3LearnedEchoPurpose: boolean;
  chapter3SawSerinFamilyRecord: boolean;
  chapter3SawEchoOriginalData: boolean;
  chapter3SawConsentForm: boolean;
  chapter3ConfirmedIanName: boolean;
  chapter3LearnedIanCoDesigner: boolean;
  chapter3RestoredExperimentOrder: boolean;
  chapter3DoctorRevealed: boolean;
  chapter3Cleared: boolean;
  chapter4Started: boolean;
  chapter4SawEchoCore: boolean;
  chapter4SawNodePanel: boolean;
  chapter4SawDoctorTerminal: boolean;
  chapter4FoundFinalSentenceFragment: boolean;
  chapter4FoundFinalSentenceFragments: boolean;
  chapter4RestoredFinalSentence: boolean;
  chapter4Cleared: boolean;
}

export interface HiddenEndingFlags {
  foundNameFragment: boolean;
  foundTrashPhoto: boolean;
  confirmedIanName: boolean;
  connectedSeohaToPhoto: boolean;
  restoredFinalSentence: boolean;
}

export interface SerinRouteFlags {
  foundSerinWarningNote: boolean;
  chapter2TalkedWithSerin: boolean;
  chapter2TalkedAboutFamilyRecord: boolean;
  chapter2SawSerinSilhouette: boolean;
  chapter3UnderstoodSerinMotive: boolean;
  chapter3MissedSerinMotive: boolean;
  serinAllyCandidate: boolean;
  serinDoubtRemains: boolean;
  chapter4SerinCanIntervene: boolean;
  chapter4SerinBlocked: boolean;
}

export interface LoreFlags {
  sawCeilingLight: boolean;
  sawLockedEchoLog: boolean;
  chapter2LearnedObservation: boolean;
  chapter2SawObservationLog: boolean;
  chapter2SawOwnObservationFeed: boolean;
  chapter2EchoReactedToName: boolean;
  chapter2EchoReactedToSea: boolean;
  chapter2EchoManifested: boolean;
  chapter3SawSeohaName: boolean;
  chapter3LearnedDoctorPhilosophy: boolean;
  chapter4ConfrontedEchoCore: boolean;
  chapter4LearnedNodeControl: boolean;
  chapter4LearnedDoctorFinalProtocol: boolean;
  chapter4UnderstoodFinalSentenceMeaning: boolean;
}

export interface GameState {
  currentScreen: Screen;
  chapter: Chapter;
  inventory: ItemId[];
  inspectedObjects: ObjectId[];
  completedHotspots: ObjectId[];
  solvedPuzzles: string[];
  suspicion: number;
  systemExposure: number;
  hintLevel: number;
  chapterCleared: boolean;
  dialogueNodeId: string | null;
  chapter1PasswordAttempts: number;
  chapter2PowerSequence: string[];
  chapter2SelectedRoute: string | null;
  chapter3ExperimentOrder: string[];
  chapter4FinalSentencePieces: string[];
  endingId: string | null;
  endingTitle: string | null;
  endingDescription: string | null;
  progressFlags: ProgressFlags;
  hiddenEndingFlags: HiddenEndingFlags;
  serinRouteFlags: SerinRouteFlags;
  loreFlags: LoreFlags;
  logs: GameLog[];
}

export interface HintResponse {
  hintLevel: number;
  hint: string;
  suspicionChange: number;
}

export interface EchoReplyResponse {
  echoReply: string;
  suspicionChange: number;
}

export interface ClueAnalysisResponse {
  summary: string;
}

