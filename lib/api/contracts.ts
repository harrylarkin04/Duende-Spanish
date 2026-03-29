/**
 * Shared API contracts for clients and future route handlers.
 * Keep in sync with route handlers under `app/api`.
 */

import type { ChatCompletionResult, ConversationSummary, ReaderTranslateResult } from "@/lib/ai/types";

export type ApiErrorBody = {
  error: string;
  code?: string;
};

export type ChatApiResponse = ChatCompletionResult & {
  meta?: { route: string; version: number };
};

export type SummaryApiResponse = ConversationSummary;

export type ReaderTranslateApiResponse = ReaderTranslateResult;

/** Planned: vocabulary / drill item generation */
export type GenerateWordRequest = {
  topic?: string;
  cefr?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  count?: number;
  locale?: string;
};

export type GenerateWordPlannedResponse = {
  ok: false;
  code: "NOT_IMPLEMENTED";
  messageEs: string;
  messageEn: string;
  expectedBody: GenerateWordRequest;
};

export type ApiCapabilitiesResponse = {
  service: string;
  version: number;
  endpoints: Record<
    string,
    { method: string; status: "live" | "planned" | "legacy"; note?: string }
  >;
};
