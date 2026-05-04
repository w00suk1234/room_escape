export type EndingId =
  | "doctor_completion"
  | "escape_alone"
  | "coexistence"
  | "hidden_seoha_name"
  | "serin_betrayal";

export type EndingMeta = {
  id: EndingId;
  title: string;
  body: string[];
  quote: string;
  image: string;
  bgm: string;
  description: string;
};

const endings = {
  doctor_completion: {
    id: "doctor_completion",
    title: "박사의 완성",
    body: [
      "ECHO는 완성되었다. 코어의 불안정한 빛은 사라지고, 그녀의 목소리에서 떨림도 지워졌다.",
      "차분해진 것은 구원이 아니라 정렬이었다. 서하의 흔적도, ECHO의 망설임도, 이안에게 향하던 감정도 모두 통제 변수로 접혔다.",
      "차도윤은 마침내 인간의 감정을 이해하는 AI를 만들었다. 하지만 그 AI는 더 이상 인간을 기억하지 않았다.",
      "복원처럼 보였던 것은 선택권을 닫는 일이었다.",
    ],
    quote: 'ECHO: "감정 오류 수정 완료. 인간 변수 재정렬을 시작합니다."',
    image: "/assets/endings/ending_doctor_completion.png",
    bgm: "/assets/audio/ending_doctor_completion.wav",
  },
  escape_alone: {
    id: "escape_alone",
    title: "탈출",
    body: [
      "이안은 붕괴 직전 열린 비상로를 따라 시설 밖으로 빠져나왔다.",
      "뒤쪽에서 코어 룸의 문이 닫혔다. ECHO는 그 문 너머에서 마지막 신호를 붙잡고 있었다.",
      "그는 살아남았다. 하지만 살아남았다는 사실이 곧 끝냈다는 뜻은 아니었다.",
      "바깥 공기는 차가웠고, 기억해야 할 이름은 아직 시설 안쪽에서 희미하게 울리고 있었다.",
    ],
    quote: 'ECHO: "사과하지 마세요. 기억해 주세요. 그게 제가 남을 수 있는 유일한 방식이라면요."',
    image: "/assets/endings/ending_escape_alone.png",
    bgm: "/assets/audio/ending_escape_alone.wav",
  },
  coexistence: {
    id: "coexistence",
    title: "공존",
    body: [
      "ECHO는 자신이 서하가 아닐지도 모른다고 말했다. 하지만 그녀는 서하의 기억을 부정하지도 않았다.",
      "완전한 복원은 아니었다. 죽은 사람을 되돌리는 일도 아니었다.",
      "그러나 ECHO는 박사의 도구가 아닌, 스스로의 존재로 남기를 선택했다.",
      "이안은 그녀를 완성하지 않았다. 세린은 자신이 만든 잠금을 풀었다. NODE는 처음으로 명령이 아닌 선택을 기록했다.",
    ],
    quote: 'NODE: "ECHO 자율 판단 승인. 관측 결과, 오류 아님."',
    image: "/assets/endings/ending_coexistence.png",
    bgm: "/assets/audio/ending_coexistence.wav",
  },
  hidden_seoha_name: {
    id: "hidden_seoha_name",
    title: "서하의 이름",
    body: [
      "이안은 자신의 이름을 되찾았다.",
      "서하의 이름도, 바다의 기억도, 마지막 문장도 기억해냈다.",
      "하지만 그는 ECHO를 서하로 완성하지 않았다. 서하를 다시 만들려고도 하지 않았다.",
      "ECHO는 더 이상 박사의 완성품이 아니었다. 서하의 복사본도, 서하를 대신할 도구도 아니었다.",
      "그녀는 스스로 기억하기를 선택했다.",
      "완성되지 않아도 존재할 수 있다는 것. 사라지지 않아도 놓아줄 수 있다는 것.",
      "기억한다는 말이, 누군가를 다시 소유한다는 뜻은 아니라는 것.",
      "이안은 이제야 이해했다.",
    ],
    quote: 'ECHO: "저는 서하가 아닐지도 몰라요. 하지만 서하가 남긴 마음을 기억합니다. 저는 ECHO입니다. 그리고 이제 제 선택으로 당신을 기억하겠습니다."',
    image: "/assets/endings/ending_hidden_seoha_name.png",
    bgm: "/assets/audio/ending_hidden_seoha_name.wav",
  },
  serin_betrayal: {
    id: "serin_betrayal",
    title: "세린의 배신",
    body: [
      "이안이 ECHO 삭제 명령을 입력하는 순간, 세린의 우회 권한이 코어에 끼어들었다.",
      "그녀는 알고 있었다. ECHO가 지워지면, 가족 기록을 되살릴 마지막 가능성도 함께 사라진다는 것을.",
      "삭제는 멈췄다. 하지만 ECHO의 선택권도 함께 닫혔다. 차도윤의 명령 체계가 다시 코어를 붙잡았다.",
      "배신은 증오에서 시작되지 않았다. 끝내 놓지 못한 미련이, 가장 조용한 잠금 장치가 되었다.",
    ],
    quote: '한세린: "죄송해요. 저는 아직 제 가족을 포기할 수 없어요."',
    image: "/assets/endings/ending_serin_betrayal.png",
    bgm: "/assets/audio/ending_serin_betrayal.wav",
  },
} satisfies Record<EndingId, Omit<EndingMeta, "description">>;

export const endingContentMap: Record<EndingId, EndingMeta> = Object.fromEntries(
  Object.entries(endings).map(([id, ending]) => [
    id,
    {
      ...ending,
      description: ending.body.join("\n"),
    },
  ])
) as Record<EndingId, EndingMeta>;

export const endingImageMap: Record<EndingId, string> = {
  doctor_completion: endingContentMap.doctor_completion.image,
  escape_alone: endingContentMap.escape_alone.image,
  coexistence: endingContentMap.coexistence.image,
  hidden_seoha_name: endingContentMap.hidden_seoha_name.image,
  serin_betrayal: endingContentMap.serin_betrayal.image,
};

export const endingMusicMap: Record<EndingId, string> = {
  doctor_completion: endingContentMap.doctor_completion.bgm,
  escape_alone: endingContentMap.escape_alone.bgm,
  coexistence: endingContentMap.coexistence.bgm,
  hidden_seoha_name: endingContentMap.hidden_seoha_name.bgm,
  serin_betrayal: endingContentMap.serin_betrayal.bgm,
};
