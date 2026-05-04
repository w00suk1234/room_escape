"use client";

import type { GameState } from "@/types/game";
import { normalizeGameState } from "@/lib/game-state";

const SAVE_KEY = "echo-doesnt-know-save";

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeGameState(JSON.parse(raw) as Partial<GameState>);
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

export function clearSavedGame(): void {
  localStorage.removeItem(SAVE_KEY);
}
