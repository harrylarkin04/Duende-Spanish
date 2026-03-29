/** CEFR-style tier for word pools and Supabase `game_records.difficulty` */
export type PalabraDifficultyLevel = "easy" | "medium" | "hard" | "expert";

/** Mix of single words, phrases, collocations, short idioms (Vortex curriculum). */
export type PalabraItemType = "word" | "phrase" | "idiom" | "collocation";

/** Single vocabulary / phrase entry for Palabra Vortex */
export type PalabraEntry = {
  /** Stable id for review deck deduping */
  id: string;
  es: string;
  en: string;
  /** Extra acceptable English glosses (normalized match) */
  acceptedEn?: string[];
  /** Cultural / usage context for Duende Hint */
  hint: string;
  /** Optional example — shown with hint */
  example?: string;
  /** When sourced from `lib/words.ts` */
  difficulty?: PalabraDifficultyLevel;
  topic?: string;
  dialect?: string;
  /** Content shape — for badges and session stats */
  itemType?: PalabraItemType;
};

export type GameModeKind = "sprint" | "endless" | "daily";

export type TranslationDirection = "es-en" | "en-es";

export type LocalLeaderEntry = {
  mode: GameModeKind;
  /** CEFR tier — optional for v1 rows read from storage */
  difficulty?: PalabraDifficultyLevel;
  score: number;
  bestStreak: number;
  at: string; // ISO date
};
