import type { PalabraDifficultyLevel, PalabraEntry } from "@/lib/games/palabra-vortex/types";

import { vortexWordsToVocabulary } from "@/lib/vortex-items";

export type WordDialect = "neutral" | "spain" | "mexico" | "rioplatense" | "caribbean" | "andean";

/** Full curriculum entry (Palabra fields + metadata) */
export type VocabularyWord = PalabraEntry & {
  difficulty: PalabraDifficultyLevel;
  topic: string;
  dialect: WordDialect;
};

export const DIFFICULTY_ORDER: PalabraDifficultyLevel[] = ["easy", "medium", "hard", "expert"];

export const DIFFICULTY_LABELS: Record<
  PalabraDifficultyLevel,
  { title: string; cefr: string; blurb: string }
> = {
  easy: {
    title: "Fácil",
    cefr: "A1–A2",
    blurb: "Palabras sueltas y frases muy cortas — respuestas en inglés de 1–3 palabras.",
  },
  medium: {
    title: "Medio",
    cefr: "B1",
    blurb: "Mezcla de léxico, frases hechas y colocaciones cotidianas.",
  },
  hard: {
    title: "Difícil",
    cefr: "B2",
    blurb: "Vocabulario intermedio + modismos breves y expresiones útiles (inglés corto).",
  },
  expert: {
    title: "Experto",
    cefr: "C1–C2",
    blurb: "Léxico avanzado e idiomas cortos — siempre traducciones de máximo 3 palabras.",
  },
};

/**
 * Vortex curriculum: 300+ items with mixed types per level (see `lib/vortex-items.json`).
 */
export const ALL_VOCABULARY_WORDS: VocabularyWord[] = vortexWordsToVocabulary().map((e) => ({
  ...e,
  difficulty: e.difficulty!,
  topic: e.topic ?? "general",
  dialect: (e.dialect as WordDialect) ?? "neutral",
}));

export const VOCABULARY_WORD_COUNT = ALL_VOCABULARY_WORDS.length;

if (process.env.NODE_ENV === "development" && VOCABULARY_WORD_COUNT < 300) {
  console.warn(
    `[duende] Expected 300+ vortex vocabulary rows; got ${VOCABULARY_WORD_COUNT}. Run: node scripts/gen-vortex-items.cjs`,
  );
}

/** Current tier plus the level just below — smoother progression. */
const TIER_MIX: Record<PalabraDifficultyLevel, PalabraDifficultyLevel[]> = {
  easy: ["easy"],
  medium: ["easy", "medium"],
  hard: ["medium", "hard"],
  expert: ["hard", "expert"],
};

export function wordsForDifficulty(level: PalabraDifficultyLevel): VocabularyWord[] {
  return ALL_VOCABULARY_WORDS.filter((w) => w.difficulty === level);
}

/** Gameplay card — same shape the vortex has always used */
export function toPalabraEntry(w: VocabularyWord): PalabraEntry {
  return {
    id: w.id,
    es: w.es,
    en: w.en,
    acceptedEn: w.acceptedEn,
    hint: w.hint,
    example: w.example,
    difficulty: w.difficulty,
    topic: w.topic,
    dialect: w.dialect,
    itemType: w.itemType,
  };
}

export function palabraPoolForDifficulty(level: PalabraDifficultyLevel): PalabraEntry[] {
  const allow = new Set(TIER_MIX[level]);
  return ALL_VOCABULARY_WORDS.filter((w) => allow.has(w.difficulty)).map(toPalabraEntry);
}
