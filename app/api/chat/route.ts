import { NextResponse } from "next/server";

import { isCompanionId } from "@/lib/ai/companion-ids";
import { completeChatTurn, toSlimMessages } from "@/lib/ai/chat-engine";
import type { ChatMessage } from "@/lib/ai/types";

/**
 * Dedicated chat completion route (recommended for new clients).
 * Legacy: `POST /api/ai` with `{ action: "chat", ... }` remains supported.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      messages?: ChatMessage[];
      companionId?: unknown;
    };

    if (!isCompanionId(body.companionId)) {
      return NextResponse.json({ error: "Invalid companionId" }, { status: 400 });
    }

    const slim = toSlimMessages(body.messages ?? []);
    const result = await completeChatTurn(slim, body.companionId);

    return NextResponse.json({
      ...result,
      meta: { route: "/api/chat", version: 1 },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
