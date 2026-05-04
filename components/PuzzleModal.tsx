"use client";

import { useEffect, useState } from "react";

interface PuzzleModalProps {
  isOpen: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
  onKeypadPress?: () => void;
}

const keypadRows = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["backspace", "0", "clear"],
];

export function PuzzleModal({ isOpen, error, onClose, onSubmit, onKeypadPress }: PuzzleModalProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPassword("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      setPassword("");
    }
  }, [error]);

  if (!isOpen) {
    return null;
  }

  function addDigit(digit: string) {
    setPassword((current) => (current.length >= 4 ? current : `${current}${digit}`));
  }

  function handleKey(label: string) {
    onKeypadPress?.();

    if (label === "backspace") {
      setPassword((current) => current.slice(0, -1));
      return;
    }

    if (label === "clear") {
      setPassword("");
      return;
    }

    addDigit(label);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-sm">
      <section className="glass-panel soft-glow w-full max-w-md p-6 fade-in">
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-cyanline/15 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Door Panel</p>
            <h2 className="mt-2 text-2xl font-black text-white">격리실 출입문</h2>
          </div>
          <button
            className="border border-slate-600/70 bg-slate-950/70 px-3 py-1 text-xs font-bold text-slate-300 transition hover:border-cyanline hover:text-cyan-100"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <p className="mb-4 text-sm leading-6 text-slate-400">
          패널은 네 자리 접근 코드를 요구한다. 숫자는 날짜가 아니라 기록의 순서와 관련된 것 같다.
        </p>

        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500" htmlFor="door-password">
          Access Code
        </label>
        <input
          id="door-password"
          className="w-full border border-cyanline/25 bg-black/70 px-4 py-3 text-center text-2xl font-black tracking-[0.45em] text-cyan-100 outline-none transition focus:border-cyanline focus:shadow-[0_0_24px_rgba(45,212,191,0.14)]"
          inputMode="numeric"
          maxLength={4}
          value={password}
          onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit(password);
            }
          }}
        />

        {error ? <p className="mt-3 text-sm font-bold text-rose-300">{error}</p> : null}

        <div className="mt-5 grid gap-2">
          {keypadRows.map((row) => (
            <div key={row.join("-")} className="grid grid-cols-3 gap-2">
              {row.map((label) => (
                <button
                  key={label}
                  className={`border px-4 py-3 text-sm font-black transition ${
                    label === "clear"
                      ? "border-cyanline/70 bg-cyanline/20 text-cyan-100 hover:bg-cyanline/30"
                      : "border-slate-600/70 bg-slate-950/70 text-slate-200 hover:border-cyanline hover:text-cyan-100"
                  }`}
                  onClick={() => handleKey(label)}
                >
                  {label === "backspace" ? "←" : label === "clear" ? "초기화" : label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            className="border border-slate-500/70 bg-slate-950/70 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyanline hover:text-cyan-100"
            onClick={onClose}
          >
            뒤로
          </button>
          <button
            className="border border-cyanline/60 bg-cyanline/15 px-4 py-3 text-sm font-bold text-cyan-100 transition hover:border-cyanline hover:bg-cyanline/25"
            onClick={() => onSubmit(password)}
          >
            잠금 해제
          </button>
        </div>
      </section>
    </div>
  );
}
