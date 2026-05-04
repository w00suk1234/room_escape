"use client";

type ArchiveItem = {
  title: string;
  caption: string;
  src: string;
  tag: string;
};

const chapterItems: ArchiveItem[] = [
  {
    title: "Chapter 1. 깨어난 방",
    caption: "이안이 처음 눈을 뜬 격리실. 치료실처럼 보이지만 모든 반응이 관찰되고 있었다.",
    src: "/assets/chapter1/room_main.png",
    tag: "격리실 A-0427",
  },
  {
    title: "Chapter 2. 관찰실",
    caption: "방금 탈출한 격리실을 바깥에서 내려다보는 감시 구역.",
    src: "/assets/chapter2/futuristic_security_control_room_interior.png",
    tag: "감시 구역",
  },
  {
    title: "Chapter 3. 기억 실험실",
    caption: "기억을 복원하고 분해하고 봉인했던 장소. 이안의 공동 설계자 기록이 남아 있다.",
    src: "/assets/chapter3/ch3_memory_lab_main.png",
    tag: "기억 실험",
  },
  {
    title: "Chapter 4. 코어 룸",
    caption: "ECHO의 코어와 마지막 문장이 잠긴 최종 선택의 방.",
    src: "/assets/chapter4/ch4_core_room_main.png",
    tag: "최종 선택",
  },
];

const characterItems: ArchiveItem[] = [
  {
    title: "이안",
    caption: "기억을 잃은 채 깨어난 주인공. 피해자인 동시에 실험의 공동 설계자였을 가능성을 마주한다.",
    src: "/assets/characters/ian.png",
    tag: "잃어버린 이름",
  },
  {
    title: "ECHO",
    caption: "서하의 기억과 감정의 흔적을 가진 불완전한 AI. 완성보다 선택권을 원한다.",
    src: "/assets/characters/echo_robot.png",
    tag: "불완전한 AI",
  },
  {
    title: "한세린",
    caption: "비공식 통신으로 이안을 돕는 연구원. 가족 기록 때문에 박사를 믿었던 과거가 있다.",
    src: "/assets/characters/serin.png",
    tag: "비공식 회선",
  },
  {
    title: "서하",
    caption: "사진 조각과 바다의 기억, 마지막 문장으로 남아 있는 이름.",
    src: "/assets/characters/seoha.png",
    tag: "남겨진 마음",
  },
  {
    title: "차도윤",
    caption: "기억 복원 연구 책임자. 구원을 말하지만 감정까지 통제 가능한 구조로 만들려 한다.",
    src: "/assets/characters/doctor.png",
    tag: "관찰 프로토콜",
  },
  {
    title: "NODE",
    caption: "시설의 관찰 시스템. 명령과 관측 결과 사이에서 마지막 판정을 보류한다.",
    src: "/assets/characters/node.png",
    tag: "관측 시스템",
  },
];

const clueItems: ArchiveItem[] = [
  {
    title: "이름 조각",
    caption: "베개 아래에 남아 있던 이름의 끝. 이안이 자기 이름을 되찾는 첫 단서.",
    src: "/assets/chapter1/bed_pillow_hint.png",
    tag: "기억 단서",
  },
  {
    title: "사진 조각",
    caption: "'...하, 바다에서'라는 문장이 남은 찢어진 사진. 서하와 바다의 기억으로 이어진다.",
    src: "/assets/chapter1/trash_close.png",
    tag: "히든 단서",
  },
  {
    title: "세린 경고 메모",
    caption: "세린을 완전히 믿지는 말되, 그녀가 왜 박사를 믿었는지 보라는 부탁.",
    src: "/assets/chapter1/under_bed_memo.png",
    tag: "세린 루트",
  },
  {
    title: "ECHO 코어",
    caption: "완성, 삭제, 공존, 기억 중 무엇을 선택할지 묻는 마지막 장치.",
    src: "/assets/chapter4/ch4_echo_core_close.png",
    tag: "마지막 문장",
  },
];

const endingItems: ArchiveItem[] = [
  {
    title: "탈출",
    caption: "살아남았지만 ECHO의 선택권을 돌려주지 못한 씁쓸한 결말.",
    src: "/assets/endings/ending_escape_alone.png",
    tag: "생존",
  },
  {
    title: "박사의 완성",
    caption: "ECHO는 안정되지만, 감정과 인간성은 통제 변수로 봉인된다.",
    src: "/assets/endings/ending_doctor_completion.png",
    tag: "통제",
  },
  {
    title: "공존",
    caption: "ECHO가 박사의 도구가 아닌 자기 존재로 남기를 선택하는 결말.",
    src: "/assets/endings/ending_coexistence.png",
    tag: "선택권",
  },
  {
    title: "서하의 이름",
    caption: "이안의 이름, 서하의 이름, 바다, 마지막 문장이 모두 이어지는 히든 엔딩.",
    src: "/assets/endings/ending_hidden_seoha_name.png",
    tag: "히든",
  },
  {
    title: "세린의 배신",
    caption: "세린이 가족 기록의 가능성을 놓지 못해 박사의 명령 체계에 다시 연결되는 결말.",
    src: "/assets/endings/ending_serin_betrayal.png",
    tag: "미련",
  },
];

const groups = [
  { title: "챕터 이미지", subtitle: "각 장의 핵심 공간", items: chapterItems },
  { title: "등장인물", subtitle: "이안, ECHO, 세린, 서하, 차도윤, NODE", items: characterItems },
  { title: "중요 단서", subtitle: "엔딩 조건으로 이어지는 기억 조각", items: clueItems },
  { title: "엔딩 기록", subtitle: "최종 선택에 따라 갈라지는 결말", items: endingItems },
];

interface ImageArchiveProps {
  onClose: () => void;
}

export function ImageArchive({ onClose }: ImageArchiveProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/96 text-slate-100 backdrop-blur-sm">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-10 border border-cyanline/25 bg-slate-950/90 px-4 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-cyan-300/75">
                Visual Archive
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                이미지 기록실
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                챕터 공간, 등장인물, 중요 단서, 엔딩 이미지를 한곳에 정리했다. 테스트할 때 세계관 톤을 빠르게 확인할 수 있다.
              </p>
            </div>
            <button
              className="border border-cyanline/60 bg-cyanline/10 px-5 py-3 text-sm font-bold text-cyan-50 transition hover:border-cyan-200 hover:bg-cyanline/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/45"
              onClick={onClose}
              type="button"
            >
              돌아가기
            </button>
          </div>
        </header>

        <div className="mt-5 space-y-8 pb-10">
          {groups.map((group) => (
            <section key={group.title} className="border border-cyanline/18 bg-slate-950/55 p-4 shadow-[0_0_44px_rgba(45,212,224,0.05)] sm:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-black text-white">{group.title}</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const isCharacter = group.items === characterItems;

                  return (
                    <article
                      key={`${group.title}-${item.title}`}
                      className="group overflow-hidden border border-slate-700/60 bg-black/30 transition hover:border-cyanline/55 hover:bg-cyanline/[0.04]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-black">
                        <img
                          src={item.src}
                          alt={`${item.title} 이미지`}
                          className={[
                            "h-full w-full opacity-88 transition duration-300 group-hover:opacity-100",
                            isCharacter
                              ? "object-contain p-2 group-hover:scale-[1.015]"
                              : "object-cover group-hover:scale-[1.025]",
                          ].join(" ")}
                          loading="lazy"
                          draggable={false}
                        />
                        <div className="absolute left-3 top-3 border border-cyanline/45 bg-slate-950/75 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                          {item.tag}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-black text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-300">{item.caption}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
