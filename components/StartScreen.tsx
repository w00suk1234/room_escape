"use client";

interface StartScreenProps {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
  onOpenArchive: () => void;
  onClearSave: () => void;
}

const introText =
  "\uAE30\uC5B5\uC744 \uC783\uC740 \uCC44 \uAE68\uC5B4\uB09C \uB2F9\uC2E0\uC740, \uB204\uAD70\uAC00\uC758 \uAE30\uB85D \uC18D\uC5D0\uC11C \uC790\uC2E0\uC758 \uC774\uB984\uC744 \uCC3E\uC544\uC57C \uD55C\uB2E4.";

const tags = [
  "\uAE30\uC5B5 \uC0C1\uC2E4",
  "\uAD00\uCC30 \uAE30\uB85D",
  "\uBD88\uC644\uC804\uD55C AI",
  "\uB9C8\uC9C0\uB9C9 \uC120\uD0DD",
];

export function StartScreen({ hasSave, onStart, onContinue, onOpenArchive, onClearSave }: StartScreenProps) {
  return (
    <main className="screen-shell min-h-screen overflow-x-hidden overflow-y-auto text-slate-100">
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 fade-in sm:px-6 lg:py-10">
        <div className="relative w-full max-w-[1180px] border border-cyanline/25 bg-slate-950/80 p-3 shadow-[0_0_80px_rgba(45,212,224,0.07),0_28px_90px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-5 lg:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(45,212,224,0.12),transparent_42%)]" />

          <div className="relative overflow-hidden rounded-[18px] border border-cyanline/35 bg-black/35 shadow-[0_0_44px_rgba(45,212,224,0.13),0_24px_80px_rgba(0,0,0,0.48)]">
            <img
              src="/images/home-hero.png"
              alt="Who Remembers Echo main visual"
              className="h-auto max-h-[520px] w-full object-contain"
              draggable={false}
            />
          </div>

          <div className="relative mx-auto flex max-w-5xl flex-col items-center px-2 pb-2 pt-5 text-center sm:px-4 sm:pt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-300/75 sm:text-xs">
              {"PRIVATE FACILITY LOG \u00B7 A-0427 \u00B7 STORY ESCAPE"}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {introText}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-cyanline/20 bg-cyanline/[0.07] px-3 py-1.5 text-[11px] font-bold tracking-[0.08em] text-cyan-100/80"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                className="border border-cyanline/70 bg-cyanline/15 px-4 py-4 font-bold text-cyan-50 shadow-[0_0_24px_rgba(45,212,224,0.10)] transition hover:border-cyan-200 hover:bg-cyanline/25 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                data-testid="start-new-game"
                onClick={onStart}
              >
                {"\uC2DC\uC791\uD558\uAE30"}
              </button>
              <button
                className="border border-slate-500/55 bg-slate-950/55 px-4 py-4 font-bold text-slate-100 transition enabled:hover:border-cyanline enabled:hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-35"
                data-testid="continue-game"
                disabled={!hasSave}
                onClick={onContinue}
              >
                {"\uC774\uC5B4\uD558\uAE30"}
              </button>
              <button
                className="border border-cyanline/35 bg-cyanline/[0.07] px-4 py-4 font-bold text-cyan-100 transition hover:border-cyanline/70 hover:bg-cyanline/15 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                data-testid="open-image-archive"
                onClick={onOpenArchive}
              >
                이미지 기록실
              </button>
              <button
                className="border border-slate-600/60 bg-slate-950/45 px-4 py-4 font-bold text-slate-300 transition hover:border-rose-300/65 hover:bg-rose-950/20 hover:text-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300/35"
                data-testid="clear-save"
                onClick={onClearSave}
              >
                {"\uC800\uC7A5 \uB370\uC774\uD130 \uC0AD\uC81C"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
