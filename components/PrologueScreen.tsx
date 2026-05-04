"use client";

interface PrologueScreenProps {
  onNext: () => void;
}

export function PrologueScreen({ onNext }: PrologueScreenProps) {
  return (
    <main className="screen-shell min-h-screen px-6 py-10 text-slate-100">
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center fade-in">
        <div className="glass-panel soft-glow w-full p-8 md:p-12">
          <div className="mb-8 border-b border-cyanline/15 pb-5">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Chapter 1</p>
            <h1 className="mt-3 text-4xl font-black text-white md:text-6xl">깨어난 방</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              이름을 잃은 채 격리실에서 깨어난다. 공식 기록은 지워졌지만, 누군가가 남긴 비공식 로그가 낮은 신호로 살아 있다.
            </p>
          </div>

          <div className="space-y-3 border border-cyanline/10 bg-black/25 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Low-Band Radio Signal</p>
            <p className="text-sm leading-7 text-slate-400">NODE: 사용자 식별 실패. 기억 손상 프로토콜 확인.</p>
            <p className="text-sm leading-7 text-slate-400">무전기: 치직... 치지직... 신호가 아주 낮게 살아난다.</p>
            <p className="border-l-2 border-cyanline/50 bg-cyanline/5 px-3 py-2 text-lg font-semibold leading-8 text-cyan-50">
              ???: 지금 들리는 목소리들을 전부 믿지는 마세요.
            </p>
            <p className="border-l-2 border-cyanline/50 bg-cyanline/5 px-3 py-2 text-lg font-semibold leading-8 text-cyan-50">
              ???: 문을 열기 전에 먼저 확인해야 합니다. 당신이 누구였는지, 누가 당신을 관찰하고 있었는지.
            </p>
          </div>

          <div className="mt-10 flex justify-end">
            <button
              className="border border-cyanline/50 bg-cyanline/10 px-6 py-3 font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/20"
              onClick={onNext}
            >
              격리실로 이동
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
