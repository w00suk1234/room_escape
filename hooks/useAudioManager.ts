"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AUDIO_SETTINGS_KEY,
  bgmMap,
  defaultAudioSettings,
  sfxMap,
  type AudioSettings,
  type BgmKey,
  type EndingMusicKey,
  type SfxKey,
} from "@/data/audio";

function clampVolume(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeAudioSettings(raw: Partial<AudioSettings> | null | undefined): AudioSettings {
  return {
    muted: typeof raw?.muted === "boolean" ? raw.muted : defaultAudioSettings.muted,
    masterVolume: clampVolume(raw?.masterVolume, defaultAudioSettings.masterVolume),
    bgmVolume: clampVolume(raw?.bgmVolume, defaultAudioSettings.bgmVolume),
    sfxVolume: clampVolume(raw?.sfxVolume, defaultAudioSettings.sfxVolume),
  };
}

function loadAudioSettings() {
  if (typeof window === "undefined") {
    return defaultAudioSettings;
  }

  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    return normalizeAudioSettings(raw ? (JSON.parse(raw) as Partial<AudioSettings>) : null);
  } catch {
    localStorage.removeItem(AUDIO_SETTINGS_KEY);
    return defaultAudioSettings;
  }
}

export function useAudioManager() {
  const [settings, setSettings] = useState<AudioSettings>(() => loadAudioSettings());
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmKeyRef = useRef<BgmKey | null>(null);
  const desiredBgmKeyRef = useRef<BgmKey | null>(null);

  const effectiveBgmVolume = settings.muted ? 0 : settings.masterVolume * settings.bgmVolume;
  const effectiveSfxVolume = settings.muted ? 0 : settings.masterVolume * settings.sfxVolume;

  useEffect(() => {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = effectiveBgmVolume;
      if (settings.muted) {
        bgmRef.current.pause();
      } else if (audioUnlocked && desiredBgmKeyRef.current) {
        bgmRef.current.play().catch((error) => console.warn("BGM playback failed", error));
      }
    }
  }, [audioUnlocked, effectiveBgmVolume, settings.muted]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.src = "";
      }
    };
  }, []);

  const stopBgm = useCallback(() => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
    currentBgmKeyRef.current = null;
  }, []);

  const playBgm = useCallback(
    (trackKey: BgmKey) => {
      desiredBgmKeyRef.current = trackKey;

      if (!audioUnlocked || settings.muted) {
        return;
      }

      const src = bgmMap[trackKey];
      if (!src) {
        console.warn(`Missing BGM source: ${trackKey}`);
        return;
      }

      if (currentBgmKeyRef.current === trackKey && bgmRef.current) {
        bgmRef.current.volume = effectiveBgmVolume;
        if (bgmRef.current.paused) {
          bgmRef.current.play().catch((error) => console.warn("BGM playback failed", error));
        }
        return;
      }

      if (bgmRef.current) {
        bgmRef.current.pause();
      }

      const bgm = new Audio(src);
      bgm.loop = true;
      bgm.volume = effectiveBgmVolume;
      bgmRef.current = bgm;
      currentBgmKeyRef.current = trackKey;
      bgm.play().catch((error) => console.warn("BGM playback failed", error));
    },
    [audioUnlocked, effectiveBgmVolume, settings.muted]
  );

  const switchBgm = useCallback((trackKey: BgmKey) => playBgm(trackKey), [playBgm]);

  const playEndingMusic = useCallback(
    (endingId: EndingMusicKey) => {
      playBgm(`ending_${endingId}` as BgmKey);
    },
    [playBgm]
  );

  const restartCurrentBgm = useCallback(() => {
    if (!bgmRef.current || !audioUnlocked || settings.muted) {
      return;
    }

    bgmRef.current.currentTime = 0;
    bgmRef.current.volume = effectiveBgmVolume;
    bgmRef.current.play().catch((error) => console.warn("BGM playback failed", error));
  }, [audioUnlocked, effectiveBgmVolume, settings.muted]);

  const playSfx = useCallback(
    (sfxKey: SfxKey) => {
      if (!audioUnlocked || settings.muted) {
        return;
      }

      const src = sfxMap[sfxKey];
      if (!src) {
        console.warn(`Missing SFX source: ${sfxKey}`);
        return;
      }

      try {
        const sfx = new Audio(src);
        sfx.volume = effectiveSfxVolume;
        sfx.play().catch((error) => console.warn("SFX playback failed", error));
      } catch (error) {
        console.warn("SFX playback failed", error);
      }
    },
    [audioUnlocked, effectiveSfxVolume, settings.muted]
  );

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setSettings((current) => ({ ...current, muted }));
  }, []);

  const setMasterVolume = useCallback((masterVolume: number) => {
    setSettings((current) => ({ ...current, masterVolume: clampVolume(masterVolume, current.masterVolume) }));
  }, []);

  const setBgmVolume = useCallback((bgmVolume: number) => {
    setSettings((current) => ({ ...current, bgmVolume: clampVolume(bgmVolume, current.bgmVolume) }));
  }, []);

  const setSfxVolume = useCallback((sfxVolume: number) => {
    setSettings((current) => ({ ...current, sfxVolume: clampVolume(sfxVolume, current.sfxVolume) }));
  }, []);

  return {
    audioUnlocked,
    settings,
    unlockAudio,
    playBgm,
    stopBgm,
    switchBgm,
    playEndingMusic,
    restartCurrentBgm,
    playSfx,
    setMuted,
    setMasterVolume,
    setBgmVolume,
    setSfxVolume,
  };
}
