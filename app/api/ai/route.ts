import { NextResponse } from "next/server";

import { isCompanionId } from "@/lib/ai/companion-ids";
import {
  completeChatTurn,
  generateConversationSummary,
  translateReaderToken,
  toSlimMessages,
} from "@/lib/ai/chat-engine";
import type { ChatMessage, CompanionId } from "@/lib/ai/types";

type ChatBody = {
  action: "chat";
  messages: ChatMessage[];
  companionId: CompanionId;
};

type SummaryBody = {
  action: "summary";
  messages: ChatMessage[];
  companionId: CompanionId;
};

type ReaderTranslateBody = {
  action: "readerTranslate";
  tokenSurface: string;
  lemma: string;
  sentence: string;
};

type AiPostBody = ChatBody | SummaryBody | ReaderTranslateBody;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiPostBody;

    if (!body || typeof body !== "object" || !("action" in body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    if (body.action === "chat") {
      if (!isCompanionId(body.companionId)) {
        return NextResponse.json({ error: "Invalid companionId" }, { status: 400 });
      }
      const slim = toSlimMessages(body.messages ?? []);
      const result = await completeChatTurn(slim, body.companionId);
      return NextResponse.json(result);
    }

    if (body.action === "summary") {
      if (!isCompanionId(body.companionId)) {
        return NextResponse.json({ error: "Invalid companionId" }, { status: 400 });
      }
      const slim = toSlimMessages(body.messages ?? []);
      const result = await generateConversationSummary(slim, body.companionId);
      return NextResponse.json(result);
    }

    if (body.action === "readerTranslate") {
      const b = body as ReaderTranslateBody;
      const tokenSurface = typeof b.tokenSurface === "string" ? b.tokenSurface.trim() : "";
      const lemma = typeof b.lemma === "string" ? b.lemma.trim() : "";
      const sentence = typeof b.sentence === "string" ? b.sentence.trim() : "";
      if (!tokenSurface || tokenSurface.length > 64 || !lemma || lemma.length > 64) {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 });
      }
      if (!sentence || sentence.length > 2000) {
        return NextResponse.json({ error: "Invalid sentence" }, { status: 400 });
      }
      const result = await translateReaderToken({
        tokenSurface,
        lemma,
        sentence,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
