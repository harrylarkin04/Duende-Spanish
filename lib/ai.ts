/**
 * Duende AI helpers — types & companion profiles are safe on client.
 * Server routes: `POST /api/chat`, `POST /api/summary` (preferred), and legacy `POST /api/ai`.
 * See `lib/ai/chat-engine.ts` for the engine.
 */

export type {
  ChatCompletionResult,
  ChatMessage,
  CompanionId,
  CompanionProfile,
  ConversationSummary,
  CorrectionSpan,
} from "./ai/types";

export { COMPANIONS, getCompanion } from "./ai/companions";
