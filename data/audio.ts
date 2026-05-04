export type EndingMusicKey = "doctor_completion" | "escape_alone" | "coexistence" | "hidden_seoha_name" | "serin_betrayal";

export type EndingBgmKey =
  | "ending_doctor_completion"
  | "ending_escape_alone"
  | "ending_coexistence"
  | "ending_hidden_seoha_name"
  | "ending_serin_betrayal";

export type BgmKey = "chapter1" | "chapter2" | "chapter3" | "chapter4" | EndingBgmKey;

export type SfxKey =
  | "click"
  | "keypadPress"
  | "error"
  | "itemGet"
  | "logOpen"
  | "doorUnlock"
  | "doorOpen"
  | "nodeAlert"
  | "echoGlitch"
  | "chapterClear"
  | "puzzleSuccess"
  | "puzzleFail";

export interface AudioSettings {
  muted: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
}

export const AUDIO_SETTINGS_KEY = "echo_audio_settings";

export const defaultAudioSettings: AudioSettings = {
  muted: false,
  masterVolume: 0.8,
  bgmVolume: 0.25,
  sfxVolume: 0.55,
};

export const bgmMap: Record<BgmKey, string> = {
  chapter1: "/assets/audio/chapter1_isolation_room_loop.wav",
  chapter2: "/assets/audio/chapter2_surveillance_loop.wav",
  chapter3: "/assets/audio/chapter3_memory_lab_loop.wav",
  chapter4: "/assets/audio/chapter4_core_room_loop.wav",
  ending_doctor_completion: "/assets/audio/ending_doctor_completion.wav",
  ending_escape_alone: "/assets/audio/ending_escape_alone.wav",
  ending_coexistence: "/assets/audio/ending_coexistence.wav",
  ending_hidden_seoha_name: "/assets/audio/ending_hidden_seoha_name.wav",
  ending_serin_betrayal: "/assets/audio/ending_serin_betrayal.wav",
};

export const endingMusicMap: Record<EndingMusicKey, string> = {
  doctor_completion: bgmMap.ending_doctor_completion,
  escape_alone: bgmMap.ending_escape_alone,
  coexistence: bgmMap.ending_coexistence,
  hidden_seoha_name: bgmMap.ending_hidden_seoha_name,
  serin_betrayal: bgmMap.ending_serin_betrayal,
};

export const sfxMap: Record<SfxKey, string> = {
  click: "/assets/audio/sfx_click.wav",
  keypadPress: "/assets/audio/sfx_keypad_press.wav",
  error: "/assets/audio/sfx_error.wav",
  itemGet: "/assets/audio/sfx_item_get.wav",
  logOpen: "/assets/audio/sfx_log_open.wav",
  doorUnlock: "/assets/audio/sfx_door_unlock.wav",
  doorOpen: "/assets/audio/sfx_door_open.wav",
  nodeAlert: "/assets/audio/sfx_node_alert.wav",
  echoGlitch: "/assets/audio/sfx_echo_glitch.wav",
  chapterClear: "/assets/audio/sfx_chapter_clear.wav",
  puzzleSuccess: "/assets/audio/sfx_puzzle_success.wav",
  puzzleFail: "/assets/audio/sfx_puzzle_fail.wav",
};
