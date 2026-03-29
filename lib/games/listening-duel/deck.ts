import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { shuffleRandom } from "@/lib/games/palabra-vortex/game-utils";

import { promptsForLevel } from "./prompts";
import type { ListeningPrompt, ShuffledListeningRound } from "./types";

const DUEL_LENGTH = 12;

export function buildListeningDeck(level: PalabraDifficultyLevel): ShuffledListeningRound[] {
  const pool = shuffleRandom([...promptsForLevel(level)]);
  if (pool.length === 0) return [];
  const picks: ListeningPrompt[] = [];
  for (let i = 0; i < DUEL_LENGTH; i++) {
    picks.push(pool[i % pool.length]);
  }
  return picks.map((prompt) => {
    if (prompt.mode === "type") {
      return { prompt, choices: [], correctIndex: -1 };
    }
    const choices = shuffleRandom([prompt.spanish, prompt.wrongMc[0], prompt.wrongMc[1], prompt.wrongMc[2]]);
    const correctIndex = choices.indexOf(prompt.spanish);
    return { prompt, choices, correctIndex };
  });
}

export const LISTENING_DUEL_ROUNDS = DUEL_LENGTH;
