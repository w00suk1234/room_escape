import { inventoryItems } from "@/data/chapter1";
import type { ClueAnalysisResponse, EchoReplyResponse, GameState, HintResponse } from "@/types/game";

export function createMockHint(gameState: GameState): HintResponse {
  const nextLevel = Math.min(gameState.hintLevel + 1, 3);

  if (gameState.chapter === 2) {
    const hints = {
      1: "CCTV 화면만 보지 말고, 각 복도 옆의 감시등과 신호 상태를 같이 읽어보자.",
      2: "완전히 꺼진 화면보다, 감시선이 끊기고 주기적으로 흔들리는 복도가 더 안전하다.",
      3: "사각지대는 B-04 복도다. 전력 순서는 관찰 전력, 통신 전력, 게이트 전력이다.",
    };

    return {
      hintLevel: nextLevel,
      hint: hints[nextLevel as 1 | 2 | 3],
      suspicionChange: 7,
    };
  }

  const hints = {
    1: "책상 메모의 항목은 일부러 섞여 있다. 숫자보다 사건의 흐름을 먼저 맞춰보자.",
    2: "NODE가 기억하는 흐름은 이름 없음 → 감시 시작 → 기억 손상 → 재각성이다.",
    3: "그 흐름에 붙은 값은 0, 4, 2, 7이다. 문 패널은 네 자리를 요구한다.",
  };

  return {
    hintLevel: nextLevel,
    hint: hints[nextLevel as 1 | 2 | 3],
    suspicionChange: 7,
  };
}

export function createMockEchoReply(selectedChoice: string): EchoReplyResponse {
  const replies: Record<string, EchoReplyResponse> = {
    listen: {
      echoReply: "신호를 열었군요. 당신은 안전합니다. 아직은요.",
      suspicionChange: 3,
    },
    reject: {
      echoReply: "거부 반응 확인. 불신은 정상적인 방어 기제입니다.",
      suspicionChange: 1,
    },
    ask_identity: {
      echoReply: "송신자 식별 실패. 저는 ECHO입니다. 그런데 왜 당신의 이름을 알고 있을까요?",
      suspicionChange: 5,
    },
  };

  return replies[selectedChoice] ?? {
    echoReply: "신호가 불완전합니다. 지금은 응답할 수 없습니다.",
    suspicionChange: 2,
  };
}

export function createMockClueAnalysis(gameState: GameState): ClueAnalysisResponse {
  const foundItems = gameState.inventory.map((itemId) => inventoryItems[itemId].name).join(", ");

  if (gameState.chapter === 2) {
    const observed = [
      gameState.progressFlags.chapter2SawObservationWindow ? "관찰창" : null,
      gameState.progressFlags.chapter2SawCctvGrid ? "감시 피드" : null,
      gameState.progressFlags.chapter2FoundBlindSpot ? "감시 사각지대" : null,
      gameState.progressFlags.chapter2PowerRestored ? "복구된 전력" : null,
      gameState.progressFlags.chapter2RestoredSerinComms ? "세린 통신" : null,
      gameState.progressFlags.chapter2MetEcho ? "ECHO 신호" : null,
    ].filter(Boolean);

    return {
      summary: observed.length
        ? `현재까지 확인한 관찰 구역 단서: ${observed.join(", ")}. 보안 게이트는 감시 사각지대, 전력, 통신, ECHO 신호가 정리되어야 반응한다.`
        : "아직 관찰 구역의 핵심 기록을 확인하지 않았다. 유리창, 감시 피드, 전력 패널부터 확인하자.",
    };
  }

  const summary = foundItems
    ? `현재까지 확보한 단서: ${foundItems}. 책상 메모의 숫자는 그대로 읽는 답이 아니라, 사건 흐름을 정렬했을 때 문 패널과 연결된다.`
    : "아직 확보한 단서가 없다. 책상 위 메모와 서랍부터 확인하자.";

  return { summary };
}
