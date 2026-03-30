import { palabraPoolForDifficulty } from "@/lib/words";

import { shuffleSeeded } from "./game-utils";
import type { PalabraDifficultyLevel, PalabraEntry } from "./types";

export const MP_CHANNEL_PREFIX = "palabra-mp-";
export const MP_BROADCAST_EVENT = "pvortex";
export const MP_ROUND_MS = 45_000;
export const MP_DEFAULT_ROUNDS = 12;
export const MP_HINT_AFTER_MS = 10_000;
/** High enough that 12 rounds usually finish before this; still allows early win by streak */
export const MP_TARGET_SCORE = 2200;
export const MP_STRIKE_BONUS = 50;
export const MP_BASE_SCORE = 100;
/** Grammar Gladiator — monster HP battle */
export const MP_MONSTER_MAX_HP = 100;
/** Skip only in the first N ms of a round (anti-spam). */
export const MP_SKIP_WINDOW_MS = 15_000;

export type MpBattleMonster = {
  key: string;
  name: string;
  emoji: string;
  subtitle: string;
};

/** Round “boss” — same for both players (deterministic). */
export const MP_ROUND_BOSS_MONSTERS: MpBattleMonster[] = [
  { key: "vampire", name: "Verb Vampire", emoji: "🧛", subtitle: "Hungry for conjugations" },
  { key: "dragon", name: "Subjunctive Dragon", emoji: "🐉", subtitle: "Burns doubt with fuego" },
  { key: "yeti", name: "Idiom Yeti", emoji: "❄️", subtitle: "Ice-cold expressions" },
  { key: "goblin", name: "Slang Goblin", emoji: "👹", subtitle: "Steals boring textbook Spanish" },
  { key: "octo", name: "Octoverb", emoji: "🐙", subtitle: "Eight ways to mean maybe" },
  { key: "bat", name: "Accent Bat", emoji: "🦇", subtitle: "Echoes tildes in the night" },
];

/** Each player’s “gladiator” avatar (deterministic). */
export const MP_PLAYER_GLADIATORS: MpBattleMonster[] = [
  { key: "lion", name: "Conjugation Lion", emoji: "🦁", subtitle: "Roars in all tenses" },
  { key: "wolf", name: "Gerund Wolf", emoji: "🐺", subtitle: "Runs with -iendo" },
  { key: "eagle", name: "Syntax Eagle", emoji: "🦅", subtitle: "Sees the clause coming" },
  { key: "bull", name: "Porque Bull", emoji: "🐂", subtitle: "Charges every connector" },
  { key: "cat", name: "Reflexive Cat", emoji: "🐈", subtitle: "Grooms itself grammatically" },
];

export function mpHashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function roundBossMonster(roundIndex: number, gameSeed: string): MpBattleMonster {
  const h = mpHashString(`${gameSeed}\nboss\n${roundIndex}`);
  return MP_ROUND_BOSS_MONSTERS[h % MP_ROUND_BOSS_MONSTERS.length];
}

export function playerGladiatorMonster(userId: string, gameSeed: string): MpBattleMonster {
  const h = mpHashString(`${gameSeed}\nglad\n${userId}`);
  return MP_PLAYER_GLADIATORS[h % MP_PLAYER_GLADIATORS.length];
}

/** Deterministic strike damage for sync (host + clients recompute from resolve payload for display). */
export function strikeMonsterDamage(roundIndex: number, gameSeed: string): number {
  const h = mpHashString(`${gameSeed}\ndmg\n${roundIndex}`);
  return 14 + (h % 17);
}

export function mpChannelName(roomCode: string) {
  return `${MP_CHANNEL_PREFIX}${roomCode}`;
}

export function flagEmoji(cc: string | null | undefined): string {
  if (!cc || cc.length !== 2) return "🌍";
  const up = cc.toUpperCase();
  if (!/^[A-Z]{2}$/.test(up)) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(...[...up].map((c) => A + (c.charCodeAt(0) - 65)));
}

const COUNTRY_LABEL: Record<string, string> = {
  GB: "United Kingdom",
  IT: "Italy",
  ES: "Spain",
  FR: "France",
  DE: "Germany",
  US: "United States",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  BR: "Brazil",
  PT: "Portugal",
  NL: "Netherlands",
  IE: "Ireland",
};

export function countryLabel(cc: string | null | undefined): string {
  if (!cc) return "Somewhere magical";
  const k = cc.toUpperCase();
  return COUNTRY_LABEL[k] ?? k;
}

export function buildMpDeck(
  seed: string,
  difficulty: PalabraDifficultyLevel,
  totalRounds: number,
): PalabraEntry[] {
  const pool = palabraPoolForDifficulty(difficulty);
  const shuffled = shuffleSeeded(pool, seed);
  return shuffled.slice(0, totalRounds);
}

export function guessBrowserCountry(): string {
  if (typeof navigator === "undefined") return "";
  const lang = navigator.language || "";
  const m = lang.match(/-([a-z]{2})/i);
  return m?.[1]?.toUpperCase() ?? "";
}

/** Deterministic ~half letters hidden — cute “censored” vibe for Duende Hint */
export function shouldHideHintLetter(char: string, index: number, seed: number): boolean {
  if (!/\p{L}/u.test(char)) return false;
  return ((seed + index * 37) % 100) < 58;
}

export function hintMaskSeed(roundIndex: number, spanish: string): number {
  let h = roundIndex * 2654435761;
  for (let i = 0; i < Math.min(spanish.length, 24); i++) {
    h = Math.imul(h ^ spanish.charCodeAt(i), 1597334677);
  }
  return Math.abs(h) % 100000;
}

export type MPBPayload =
  | {
      t: "game_start";
      seed: string;
      difficulty: PalabraDifficultyLevel;
      totalRounds: number;
      targetScore: number;
      roundIndex: number;
      roundEndsAt: number;
    }
  | { t: "round_start"; roundIndex: number; roundEndsAt: number }
  | { t: "claim"; roundIndex: number; userId: string; at: number }
  | {
      t: "resolve";
      roundIndex: number;
      firstUserId: string | null;
      scores: Record<string, number>;
      strikeUserId: string | null;
      winnerReactMs?: number | null;
      strikeWasIdiom?: boolean;
      monsterHp?: Record<string, number>;
      skippedBy?: string | null;
      koWinnerId?: string | null;
      battleDamage?: { victimId: string; amount: number; attackerId: string } | null;
      strikeScoreDoubled?: boolean;
    }
  | { t: "reaction"; userId: string; preset: string }
  | { t: "strike_flash"; winnerId: string; displayName: string }
  | { t: "hint_spent"; roundIndex: number; userId: string }
  | { t: "skip_request"; roundIndex: number; userId: string }
  | { t: "duende_rage"; roundIndex: number; userId: string }
  | { t: "rematch" };

export function isMPPayload(x: unknown): x is MPBPayload {
  return typeof x === "object" && x !== null && "t" in (x as object);
}
