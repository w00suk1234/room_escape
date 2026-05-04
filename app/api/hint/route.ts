import { NextResponse } from "next/server";
import { createMockHint } from "@/lib/mock-ai";
import type { GameState } from "@/types/game";

export async function POST(request: Request) {
  const body = (await request.json()) as { gameState: GameState };
  const hint = createMockHint(body.gameState);

  return NextResponse.json(hint);
}
