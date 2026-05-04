export type DialogueChoiceId =
  | "ask_identity"
  | "ask_place"
  | "ask_open"
  | "who_observed"
  | "doctor_hint"
  | "echo_hint_early"
  | "why_help"
  | "access_trace";

export interface DialogueNodeData {
  id: string;
  speaker: string;
  text: string;
  next?: string;
  choices?: {
    label: string;
    next: DialogueChoiceId | string;
  }[];
  effects?: string[];
  end?: boolean;
}

export const chapter1DoorDialogue: Record<string, DialogueNodeData> = {
  start: {
    id: "start",
    speaker: "한세린",
    text: "...들리나요? 제 이름은 한세린이에요. 이 시설의 연구원이었습니다.",
    choices: [
      { label: "여긴 어디죠?", next: "ask_place" },
      { label: "문을 열어줘요", next: "ask_open" },
    ],
  },
  ask_identity: {
    id: "ask_identity",
    speaker: "한세린",
    text: "제 이름은 한세린이에요. 이 시설의 연구원이었습니다.",
    next: "identity_1",
    effects: ["revealSerinName", "progressFlags.serinIdentified"],
  },
  identity_1: {
    id: "identity_1",
    speaker: "한세린",
    text: "지금부터 제 말을 전부 믿으라고 하진 않을게요. 하지만 공식 기록이 지워진 뒤에도, 제가 남긴 로그만은 일부 살아남았습니다.",
    next: "identity_2",
  },
  identity_2: {
    id: "identity_2",
    speaker: "한세린",
    text: "문을 열려면 접근 카드가 필요해요. 방 안의 책상과 서랍을 먼저 확인하세요.",
    effects: ["progressFlags.talkedToSerinAtDoor", "addLog.externalComms"],
    end: true,
  },
  ask_place: {
    id: "ask_place",
    speaker: "한세린",
    text: "공식 명칭은 격리실입니다. 하지만 기록을 보면 치료실보다는 관찰실에 가까워요.",
    next: "ask_place_2",
  },
  ask_place_2: {
    id: "ask_place_2",
    speaker: "한세린",
    text: "당신은 회복 중이었던 게 아니에요. 누군가 당신의 반응을 계속 기록하고 있었습니다.",
    choices: [
      { label: "누가 나를 관찰했죠?", next: "who_observed" },
    ],
  },
  who_observed: {
    id: "who_observed",
    speaker: "한세린",
    text: "기록상 책임자는 차도윤 박사입니다. NODE는 그의 관찰 프로토콜을 아직도 수행하고 있어요.",
    choices: [
      { label: "차도윤 박사가 누구죠?", next: "doctor_hint" },
      { label: "아는 척하는 목소리가 ECHO인가요?", next: "echo_hint_early" },
    ],
  },
  doctor_hint: {
    id: "doctor_hint",
    speaker: "한세린",
    text: "차도윤 박사는 기억 복원 연구 책임자였습니다. 지금은 그가 선한지 악한지보다, 무엇을 숨겼는지가 중요합니다.",
    end: true,
  },
  echo_hint_early: {
    id: "echo_hint_early",
    speaker: "한세린",
    text: "ECHO가 당신을 속인다는 뜻은 아니에요. 하지만 지금의 ECHO는 자신이 누구인지도 완전히 알지 못합니다. 먼저 방 안의 기록을 직접 확인하세요.",
    end: true,
  },
  ask_open: {
    id: "ask_open",
    speaker: "한세린",
    text: "제가 직접 열 수는 없어요. 제 권한은 대부분 차단됐습니다. 하지만 우회할 수는 있어요.",
    next: "ask_open_2",
  },
  ask_open_2: {
    id: "ask_open_2",
    speaker: "한세린",
    text: "책상 위의 기록. 그리고 닫히지 않은 서랍. 그 둘을 먼저 확인하세요.",
    choices: [
      { label: "왜 나를 돕죠?", next: "why_help" },
      { label: "접근 흔적이 뭐죠?", next: "access_trace" },
    ],
  },
  why_help: {
    id: "why_help",
    speaker: "한세린",
    text: "제가 만든 일부가 아직 이 방에 남아 있기 때문이에요. 당신이 스스로를 기억하지 못하게 만드는 구조가 아직 작동 중입니다.",
    end: true,
  },
  access_trace: {
    id: "access_trace",
    speaker: "한세린",
    text: "책상 위의 기록과 닫히지 않은 서랍. 그 둘이 제가 남긴 작은 틈입니다.",
    end: true,
  },
};

export const chapter1DoorAfterMemoDialogue = [
  "메모를 찾았군요.",
  "그 숫자들은 날짜가 아니에요.",
  "이 방의 기록은 시간순으로 정렬되지 않습니다.",
  "차도윤 박사는 사건을 시간보다 관찰 순서로 남기는 습관이 있었어요.",
  "이름 없음, 감시 시작, 기억 손상, 재각성.",
  "문은 날짜로 열리지 않아요. 남겨진 기록의 순서로 열립니다.",
];

export const chapter1DoorAfterCardDialogue = [
  "카드키를 찾았군요.",
  "좋아요, 이제 패널이 반응할 거예요.",
  "하지만 코드를 틀릴 때마다 감시 레벨이 올라갈 겁니다. 너무 많이 시도하지 마세요.",
  "그리고 문이 열리면 ECHO가 말을 걸 거예요.",
  "그녀를 완전히 믿지도, 완전히 미워하지도 마세요. 지금의 ECHO는 자신이 누구인지 모릅니다.",
];

