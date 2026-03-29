import { NextResponse } from "next/server";

import type {
  ApiCapabilitiesResponse,
  GenerateWordPlannedResponse,
  GenerateWordRequest,
} from "@/lib/api/contracts";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

function parseCefr(x: unknown): GenerateWordRequest["cefr"] | undefined {
  return typeof x === "string" && (CEFR_LEVELS as readonly string[]).includes(x)
    ? (x as GenerateWordRequest["cefr"])
    : undefined;
}

/**
 * Planned: AI-generated vocabulary / example sentences by topic & CEFR.
 * POST returns 501 with contract until `lib/ai` generation is wired.
 */
export async function GET() {
  const body: ApiCapabilitiesResponse = {
    service: "duende-api",
    version: 1,
    endpoints: {
      "/api/chat": {
        method: "POST",
        status: "live",
        note: "messages + companionId",
      },
      "/api/summary": {
        method: "POST",
        status: "live",
        note: "messages + companionId",
      },
      "/api/ai": {
        method: "POST",
        status: "legacy",
        note: "action: chat | summary | readerTranslate",
      },
      "/api/generate-word": {
        method: "POST",
        status: "planned",
        note: "topic, cefr, count",
      },
    },
  };
  return NextResponse.json(body);
}

export async function POST(req: Request) {
  let partial: Record<string, unknown> = {};
  try {
    partial = (await req.json()) as Record<string, unknown>;
  } catch {
    /* empty body ok */
  }

  const res: GenerateWordPlannedResponse = {
    ok: false,
    code: "NOT_IMPLEMENTED",
    messageEs:
      "La generación de palabras con IA todavía no está conectada. Usá Palabra Vortex o el lector inmersivo mientras tanto.",
    messageEn:
      "AI word generation is not wired yet. Use Palabra Vortex or Immersive Media in the meantime.",
    expectedBody: {
      topic: typeof partial.topic === "string" ? partial.topic : undefined,
      cefr: parseCefr(partial.cefr),
      count: typeof partial.count === "number" ? partial.count : undefined,
      locale: typeof partial.locale === "string" ? partial.locale : undefined,
    },
  };

  return NextResponse.json(res, { status: 501 });
}
