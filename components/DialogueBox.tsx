"use client";

import { characterPortraits, type CharacterPortraitKey } from "@/data/characters";

export interface DialogueLine {
  speaker: string;
  text: string | string[];
  tone?: "serin" | "echo" | "node" | "system" | "player";
  choices?: {
    label: string;
    onSelect: () => void;
  }[];
}

interface DialogueBoxProps {
  line: DialogueLine | null;
  remaining: number;
  onNext: () => void;
}

const toneMeta: Record<
  NonNullable<DialogueLine["tone"]>,
  {
    label: string;
    text: string;
    glow: string;
  }
> = {
  serin: {
    label: "COMM LINK",
    text: "text-cyan-50",
    glow: "from-cyan-400/24",
  },
  echo: {
    label: "ECHO SIGNAL",
    text: "text-sky-50",
    glow: "from-sky-400/26",
  },
  node: {
    label: "NODE RELAY",
    text: "text-slate-100",
    glow: "from-slate-300/18",
  },
  system: {
    label: "INNER LOG",
    text: "text-slate-100",
    glow: "from-cyan-400/16",
  },
  player: {
    label: "INNER VOICE",
    text: "text-slate-100",
    glow: "from-cyan-400/16",
  },
};

function normalizeText(text: string | string[]) {
  return Array.isArray(text) ? text.filter(Boolean) : [text];
}

function displaySpeaker(line: DialogueLine) {
  return line.speaker;
}

function displayChannelLabel(line: DialogueLine, fallback: string) {
  const speaker = displaySpeaker(line);
  if (speaker.includes("차도윤") || speaker.includes("원격 송신")) return "REMOTE FEED";
  if (speaker.includes("무전기")) return "RADIO";
  if (speaker.includes("기록")) return "RECORDED LOG";
  return fallback;
}

function portraitFor(line: DialogueLine): CharacterPortraitKey {
  const speaker = displaySpeaker(line);

  if (line.tone === "node" || speaker.includes("NODE")) return "node";
  if (line.tone === "echo" || speaker.includes("ECHO")) return "echo";
  if (line.tone === "serin" || speaker.includes("한세린") || speaker.includes("???")) return "serin";
  if (speaker.includes("서하")) return "seoha";
  if (speaker.includes("차도윤") || speaker.includes("박사")) return "doctor";
  return "ian";
}

function shouldShowPortrait(line: DialogueLine) {
  const speaker = displaySpeaker(line);
  return !speaker.includes("무전기") && !speaker.includes("끊긴 음성") && !speaker.includes("기록");
}

function isRawTransmission(line: DialogueLine) {
  const speaker = displaySpeaker(line);
  return speaker.includes("무전기") || speaker.includes("끊긴 음성");
}

function isSystemLogLine(line: DialogueLine) {
  const speaker = displaySpeaker(line);
  return (
    line.tone === "node" ||
    speaker.includes("NODE") ||
    speaker.includes("기록") ||
    speaker.includes("무전기") ||
    speaker.includes("끊긴 음성") ||
    speaker.includes("깨진 음성")
  );
}

function isMonologueText(line: DialogueLine, text: string) {
  if (isRawTransmission(line) || isSystemLogLine(line)) return false;

  const speaker = displaySpeaker(line);
  if (line.tone === "system" && speaker.includes("이안")) return true;
  if (line.tone !== "player") return false;

  const trimmed = text.trim();
  if (!trimmed) return false;
  if (trimmed.endsWith("?") || trimmed.endsWith("!") || trimmed.includes("요.")) return false;
  if (/^(그래|아니|좋아|ECHO|서하|차도윤|NODE|한세린|나는|내가|너는|당신은|세린 씨)/.test(trimmed)) return false;

  return true;
}

function isCharacterDialogue(line: DialogueLine, text: string) {
  if (isRawTransmission(line) || isSystemLogLine(line) || isMonologueText(line, text)) return false;

  const speaker = displaySpeaker(line);
  return (
    line.tone === "serin" ||
    line.tone === "echo" ||
    speaker.includes("차도윤") ||
    speaker.includes("한세린") ||
    speaker.includes("ECHO") ||
    speaker.includes("서하") ||
    speaker.includes("???") ||
    line.tone === "player"
  );
}

function isAlreadyQuoted(text: string) {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('"') ||
    trimmed.endsWith('"') ||
    trimmed.startsWith("“") ||
    trimmed.endsWith("”") ||
    trimmed.startsWith("'") ||
    trimmed.endsWith("'") ||
    trimmed.startsWith("‘") ||
    trimmed.endsWith("’")
  );
}

function formatDialogueText(line: DialogueLine, text: string) {
  if (!text.trim() || isRawTransmission(line) || isAlreadyQuoted(text)) {
    return text;
  }

  if (isMonologueText(line, text)) {
    return `'${text}'`;
  }

  if (isCharacterDialogue(line, text)) {
    return `"${text}"`;
  }

  return text;
}

export function DialogueBox({ line, remaining, onNext }: DialogueBoxProps) {
  if (!line) {
    return null;
  }

  const tone = line.tone ?? "system";
  const meta = toneMeta[tone];
  const lines = normalizeText(line.text);
  const activePortraitKey = portraitFor(line);
  const showPortrait = shouldShowPortrait(line);

  return (
    <section className="pointer-events-none relative min-h-[250px] overflow-visible fade-in" data-testid="dialogue-panel">
      {showPortrait ? (
        <>
          <div
            className={`pointer-events-none absolute bottom-[88px] left-4 hidden h-[360px] w-[260px] bg-gradient-radial ${meta.glow} to-transparent opacity-80 blur-2xl md:block`}
          />
          <div className="pointer-events-none absolute bottom-[92px] left-2 z-20 hidden h-[390px] w-[290px] md:block">
            {Object.entries(characterPortraits).map(([key, src]) => {
              const isActive = key === activePortraitKey;

              return (
                <img
                  key={key}
                  alt={isActive ? `${displaySpeaker(line)} portrait` : ""}
                  aria-hidden={!isActive}
                  className={`absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_22px_42px_rgba(0,0,0,0.82)] transition-opacity duration-150 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                  decoding="async"
                  src={src}
                />
              );
            })}
          </div>
        </>
      ) : null}

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 border border-cyanline/35 bg-slate-950/95 shadow-[0_18px_80px_rgba(0,0,0,0.86)] backdrop-blur-md">
        <div className="grid min-h-[156px] md:grid-cols-[300px_1fr]">
          <div className="relative hidden overflow-hidden border-r border-cyanline/20 bg-black/80 px-6 py-5 md:block">
            <div className={`absolute inset-0 bg-gradient-to-r ${meta.glow} via-transparent to-transparent opacity-40`} />
            <div className="absolute inset-y-5 left-5 w-px bg-cyanline/45" />
            <div className="relative z-10">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.32em] text-cyan-200">
                {displayChannelLabel(line, meta.label)}
              </p>
              <p className="mt-3 text-2xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
                {displaySpeaker(line)}
              </p>
            </div>
          </div>

          <div className="px-5 py-5 md:px-7">
            <div className="flex items-center justify-between gap-4 md:hidden">
              <p className="text-sm font-black text-white">{displaySpeaker(line)}</p>
            </div>

            <div className="rounded-sm border border-cyanline/15 bg-black/58 px-5 py-4 shadow-[inset_0_0_28px_rgba(0,0,0,0.42)]">
              <div className={`space-y-2 text-lg font-semibold leading-8 md:text-xl ${meta.text}`}>
                {lines.map((text, index) => {
                  const isMonologue = isMonologueText(line, text);
                  const displayedText = formatDialogueText(line, text);

                  return (
                    <p
                      key={`${text}-${index}`}
                      className={`drop-shadow-[0_2px_10px_rgba(0,0,0,1)] ${
                        isMonologue ? "italic text-slate-200" : undefined
                      }`}
                    >
                      {displayedText}
                    </p>
                  );
                })}
              </div>
            </div>

            {line.choices?.length ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {line.choices.map((choice) => (
                  <button
                    key={choice.label}
                    className="border border-cyanline/40 bg-slate-950/70 px-4 py-3 text-left text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/15"
                    onClick={choice.onSelect}
                    type="button"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex justify-end">
                <button
                  className="border border-cyanline/50 bg-cyanline/10 px-6 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/20"
                  data-testid="dialogue-next"
                  onClick={onNext}
                  type="button"
                >
                  {remaining > 0 ? "다음" : "확인"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


