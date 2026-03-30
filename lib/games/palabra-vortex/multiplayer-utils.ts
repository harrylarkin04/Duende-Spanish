import { palabraPoolForDifficulty } from "@/lib/words";

import { shuffleSeeded } from "./game-utils";
import type { PalabraDifficultyLevel, PalabraEntry } from "./types";

export const MP_CHANNEL_PREFIX = "palabra-mp-";
export const MP_BROADCAST_EVENT = "pvortex";
export const MP_ROUND_MS = 60_000;
export const MP_DEFAULT_ROUNDS = 9;
export const MP_TARGET_SCORE = 1000;
export const MP_STRIKE_BONUS = 50;
export const MP_BASE_SCORE = 100;

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
    }
  | { t: "reaction"; userId: string; preset: string }
  | { t: "strike_flash"; winnerId: string; displayName: string }
  | { t: "rematch" };

export function isMPPayload(x: unknown): x is MPBPayload {
  return typeof x === "object" && x !== null && "t" in (x as object);
}
