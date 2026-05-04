import type { Chapter1ImageKey, Chapter1ObjectId, HotspotConfig, InventoryItem, ItemId } from "@/types/game";

export const CHAPTER_TITLE = "Chapter 1. 깨어난 방";
export const CHAPTER_GOAL = "격리실을 조사하고 문 패널을 해제하라";
export const DOOR_PASSWORD = "0427";

export const deskMemoPuzzleText = [
  "기록은 시간순으로 남지 않는다.",
  "",
  "이름 없음 - 0",
  "감시 시작 - 4",
  "기억 손상 - 2",
  "재각성 - 7",
  "",
  "문은 날짜로 열리지 않는다.",
  "남겨진 기록의 순서로 열린다.",
].join("\n");

export const prologueLines = [
  "NODE: 사용자 식별 실패. 기억 손상 프로토콜 확인.",
  "NODE: 격리 절차 재개.",
  "무전기: 치직... 치지직... 신호가 아주 낮게 살아난다.",
  "한세린: 제 이름은 한세린이에요. 이 시설의 연구원이었습니다.",
  "한세린: 이 기록을 보고 있다면, 당신은 다시 깨어난 겁니다.",
  "한세린: 지금 들리는 목소리들을 전부 믿지는 마세요.",
  "한세린: 이 방의 기록은 누군가가 의도적으로 순서를 바꿔뒀어요.",
  "한세린: 문을 열기 전에 먼저 확인해야 합니다.",
  "한세린: 당신이 누구였는지, 그리고 누가 당신을 관찰하고 있었는지.",
];

export const imageMap: Record<Chapter1ImageKey, string> = {
  roomMain: "/assets/chapter1/room_main.png",
  bedPillowHint: "/assets/chapter1/bed_pillow_hint.png",
  ceilingCctv: "/assets/chapter1/ceiling_cctv.png",
  deskNote: "/assets/chapter1/desk_note.png",
  doorPanelClose: "/assets/chapter1/door_panel_close.png",
  doorPasswordHint: "/assets/chapter1/door_password_hint.png",
  drawerKeycard: "/assets/chapter1/drawer_keycard.png",
  trashClose: "/assets/chapter1/trash_close.png",
  underBedMemo: "/assets/chapter1/under_bed_memo.png",
  wallMonitor: "/assets/chapter1/wall_monitor.png",
  monitorEchoLog: "/assets/chapter1/wall_monitor.png",
};

export const inventoryItems: Record<ItemId, InventoryItem> = {
  torn_memo_a: {
    id: "torn_memo_a",
    name: "찢어진 메모",
    description: deskMemoPuzzleText,
  },
  access_card: {
    id: "access_card",
    name: "카드키",
    description: "표면에는 긁힌 자국이 많지만 신호는 살아 있다. 'SE-RIN' 권한 일부가 남아 있다.",
  },
  name_fragment: {
    id: "name_fragment",
    name: "이름 조각",
    description: "식별 태그 끝에 '...안'만 남아 있다. 볼수록 머릿속 어딘가가 미세하게 울린다.",
  },
  torn_photo_fragment: {
    id: "torn_photo_fragment",
    name: "사진 조각",
    description: "잘린 문장 일부가 보인다. '...하, 바다에서' 누군가의 이름과 장소가 함께 잘려 나갔다.",
  },
  serin_warning_note: {
    id: "serin_warning_note",
    name: "세린 경고 메모",
    description:
      "세린을 완전히 믿지는 마세요. 하지만 그녀가 왜 차도윤 박사를 믿었는지는 알아야 합니다. 그녀의 가족 기록을 찾으세요. 가족을 잃은 사람은, 거짓된 가능성도 쉽게 버리지 못합니다.",
  },
};

export const objectLabels: Record<Chapter1ObjectId, string> = {
  bed: "베개",
  underBed: "침대 밑",
  desk: "책상 위 메모",
  drawer: "책상 서랍",
  monitor: "벽 모니터",
  trash: "쓰레기통",
  doorPanel: "문 패널",
  camera: "천장 CCTV",
  serinComms: "문 너머 통신",
};

export const chapter1Hotspots: HotspotConfig<Chapter1ObjectId>[] = [
  { id: "camera", x: 50.8, y: 7.8, label: objectLabels.camera, type: "lore", imageKey: "ceilingCctv", stateKey: "loreFlags.sawCeilingLight" },
  { id: "bed", x: 25.0, y: 59.0, label: objectLabels.bed, type: "memory", imageKey: "bedPillowHint", stateKey: "hiddenEndingFlags.foundNameFragment" },
  { id: "underBed", x: 21.0, y: 81.0, label: objectLabels.underBed, type: "serin", imageKey: "underBedMemo", stateKey: "serinRouteFlags.foundSerinWarningNote" },
  { id: "trash", x: 29.5, y: 80.5, label: objectLabels.trash, type: "memory", imageKey: "trashClose", stateKey: "hiddenEndingFlags.foundTrashPhoto" },
  { id: "desk", x: 54.0, y: 54.0, label: objectLabels.desk, type: "progress", imageKey: "deskNote", stateKey: "progressFlags.foundDeskMemo" },
  { id: "drawer", x: 60.5, y: 61.0, label: objectLabels.drawer, type: "progress", imageKey: "drawerKeycard", stateKey: "progressFlags.foundAccessCard" },
  { id: "monitor", x: 70.0, y: 40.5, label: objectLabels.monitor, type: "lore", imageKey: "wallMonitor", stateKey: "loreFlags.sawLockedEchoLog" },
  { id: "serinComms", x: 84.5, y: 52.0, label: objectLabels.serinComms, type: "serin", imageKey: "doorPasswordHint", stateKey: "progressFlags.talkedToSerinAtDoor", zIndex: 12 },
  { id: "doorPanel", x: 94.0, y: 51.5, label: objectLabels.doorPanel, type: "progress", imageKey: "doorPanelClose", stateKey: "progressFlags.unlockedDoorPanel", zIndex: 13 },
];
