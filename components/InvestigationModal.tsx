"use client";

interface ModalChoiceAction {
  label: string;
  description?: string;
  onClick: () => void;
  tone?: "default" | "danger";
  testId?: string;
}

interface InvestigationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  imageSrc?: string;
  imageObjectPosition?: string;
  items?: string[];
  eyebrow?: string;
  actionLabel?: string;
  primaryActionLabel?: string;
  choiceActions?: ModalChoiceAction[];
  size?: "normal" | "wide";
  onClose: () => void;
  onPrimaryAction?: () => void;
}

export function InvestigationModal({
  isOpen,
  title,
  description,
  imageSrc,
  imageObjectPosition = "center",
  items = [],
  eyebrow = "Scan Result",
  actionLabel = "뒤로",
  primaryActionLabel,
  choiceActions = [],
  size = "normal",
  onClose,
  onPrimaryAction,
}: InvestigationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className={`glass-panel soft-glow max-h-[92vh] w-full overflow-y-auto p-6 fade-in ${
          size === "wide" ? "max-w-4xl" : "max-w-lg"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-cyanline/15 pb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        </div>
        {imageSrc ? (
          <div className="mt-5 overflow-hidden border border-cyanline/15 bg-black/50">
            <img
              src={imageSrc}
              alt={title}
              className="h-[300px] w-full bg-black object-contain"
              style={{ objectPosition: imageObjectPosition }}
            />
          </div>
        ) : null}
        <div className="mt-5 space-y-2 text-base leading-8 text-slate-100">
          {description.split("\n").map((line, index) => {
            const trimmed = line.trim();
            const isQuote = trimmed.startsWith("“") || trimmed.startsWith("\"");
            const isCodeLine = trimmed.startsWith("[") || trimmed.includes("—");
            return (
              <p
                key={`${line}-${index}`}
                className={
                  isQuote
                    ? "border-l-2 border-cyanline/50 bg-cyanline/5 px-3 py-1 font-semibold text-cyan-50"
                    : isCodeLine
                      ? "font-mono text-cyan-100"
                      : "text-slate-100"
                }
              >
                {line}
              </p>
            );
          })}
        </div>
        {items.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className="border border-cyanline/30 bg-cyanline/10 px-3 py-1 text-xs font-bold text-cyan-100"
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
        {choiceActions.length > 0 ? (
          <div className={`mt-6 grid gap-2 ${size === "wide" ? "md:grid-cols-2" : ""}`}>
            {choiceActions.map((choice) => (
              <button
                key={choice.label}
                className={`border px-4 py-3 text-left text-sm font-bold transition ${
                  choice.tone === "danger"
                    ? "border-rose-300/45 bg-rose-950/25 text-rose-100 hover:border-rose-200"
                    : "border-cyanline/35 bg-cyanline/10 text-cyan-100 hover:border-cyanline hover:bg-cyanline/20"
                }`}
                data-testid={choice.testId}
                onClick={choice.onClick}
              >
                <span className="block text-base">{choice.label}</span>
                {choice.description ? (
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-300">{choice.description}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-7 flex justify-end gap-3">
          <button
            className="border border-slate-500/70 bg-slate-950/70 px-5 py-2 text-sm font-bold text-slate-200 transition hover:border-cyanline hover:text-cyan-100"
            onClick={onClose}
          >
            {actionLabel}
          </button>
          {primaryActionLabel && onPrimaryAction ? (
            <button
              className="border border-cyanline/60 bg-cyanline/15 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
