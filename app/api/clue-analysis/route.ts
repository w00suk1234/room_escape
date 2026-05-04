import { NextResponse } from "next/server";
import { createMockClueAnalysis } from "@/lib/mock-ai";
import type { GameState } from "@/types/game";

export async function POST(request: Request) {
  const body = (await request.json()) as { gameState: GameState };
  const analysis = createMockClueAnalysis(body.gameState);

  return NextResponse.json(analysis);
}
