import type { Chapter2ImageKey, Chapter2ObjectId, HotspotConfig } from "@/types/game";

export const CHAPTER2_TITLE = "Chapter 2. 관찰실";
export const CHAPTER2_GOAL = "감시망을 우회하고 보안 게이트를 해제하라";

export const chapter2ImageMap: Record<Chapter2ImageKey, string> = {
  chapter2MainCorridor: "/assets/chapter2/futuristic_hallway_with_security_features.png",
  observationWindowDetail: "/assets/chapter2/futuristic_industrial_control_panel_close_up.png",
  surveillanceRoomDetail: "/assets/chapter2/futuristic_security_control_room_interior.png",
  cctvGridDisplay: "/assets/chapter2/futuristic_surveillance_room_grid_display.png",
  powerControlPanel: "/assets/chapter2/cold_metallic_corridor_with_observation_window.png",
  communicationConsole: "/assets/chapter2/futuristic_industrial_corridor_with_tech_details.png",
  echoHologramEvent: "/assets/chapter2/holographic_figure_in_futuristic_corridor.png",
  serinSilhouette: "/assets/chapter2/futuristic_industrial_control_panel_close_up.png",
  securityGateDetail: "/assets/chapter2/futuristic_industrial_communication_console.png",
};

export const chapter2ObjectLabels: Record<Chapter2ObjectId, string> = {
  observationWindow: "관찰창",
  surveillanceRoom: "감시실",
  cctvGrid: "감시 피드",
  powerPanel: "전력 패널",
  communicationConsole: "통신 콘솔",
  echoHologram: "ECHO 신호",
  serinSilhouette: "세린 실루엣",
  securityGate: "보안 게이트",
};

export const chapter2Hotspots: HotspotConfig<Chapter2ObjectId>[] = [
  { id: "observationWindow", x: 12.8, y: 43.2, label: chapter2ObjectLabels.observationWindow, type: "lore", imageKey: "observationWindowDetail", stateKey: "loreFlags.chapter2LearnedObservation" },
  { id: "surveillanceRoom", x: 17.8, y: 51.2, label: chapter2ObjectLabels.surveillanceRoom, type: "progress", imageKey: "surveillanceRoomDetail", stateKey: "progressFlags.chapter2SawSurveillanceRoom" },
  { id: "cctvGrid", x: 84.4, y: 39.0, label: chapter2ObjectLabels.cctvGrid, type: "lore", imageKey: "cctvGridDisplay", stateKey: "loreFlags.chapter2SawOwnObservationFeed", zIndex: 12 },
  { id: "powerPanel", x: 68.2, y: 50.0, label: chapter2ObjectLabels.powerPanel, type: "progress", imageKey: "powerControlPanel", stateKey: "progressFlags.chapter2PowerRestored" },
  { id: "communicationConsole", x: 24.0, y: 43.0, label: chapter2ObjectLabels.communicationConsole, type: "serin", imageKey: "communicationConsole", stateKey: "serinRouteFlags.chapter2TalkedWithSerin", zIndex: 12 },
  { id: "echoHologram", x: 50.0, y: 29.0, label: chapter2ObjectLabels.echoHologram, type: "echo", imageKey: "echoHologramEvent", stateKey: "loreFlags.chapter2EchoManifested", zIndex: 14 },
  { id: "serinSilhouette", x: 15.2, y: 35.5, label: chapter2ObjectLabels.serinSilhouette, type: "serin", imageKey: "serinSilhouette", stateKey: "serinRouteFlags.chapter2SawSerinSilhouette", zIndex: 13 },
  { id: "securityGate", x: 50.0, y: 50.5, label: chapter2ObjectLabels.securityGate, type: "progress", imageKey: "securityGateDetail", stateKey: "progressFlags.chapter2GateUnlocked", zIndex: 11 },
];
