import { NextResponse } from "next/server";
import { createMockEchoReply } from "@/lib/mock-ai";
import type { GameState } from "@/types/game";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    selectedChoice: string;
    currentGameState: GameState;
  };
  const reply = createMockEchoReply(body.selectedChoice);

  return NextResponse.json(reply);
}
