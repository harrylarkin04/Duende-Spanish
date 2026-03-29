import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";

export type GrammarTopicId =
  | "conjugation"
  | "ser-estar"
  | "subjunctive"
  | "agreement"
  | "por-para"
  | "preterite-imperfect";

export type ChallengeDef = {
  id: string;
  topic: GrammarTopicId;
  /** Which difficulty tiers can draw this challenge */
  levels: PalabraDifficultyLevel[];
  prompt: string;
  correct: string;
  wrong: [string, string, string];
  hintWrong: string;
  /** Eligible for final boss round */
  boss?: boolean;
};

export const GRAMMAR_TOPIC_LABELS: Record<GrammarTopicId, string> = {
  conjugation: "Conjugación",
  "ser-estar": "Ser / estar",
  subjunctive: "Subjuntivo",
  agreement: "Concordancia",
  "por-para": "Por / para",
  "preterite-imperfect": "Pretérito / imperfecto",
};
