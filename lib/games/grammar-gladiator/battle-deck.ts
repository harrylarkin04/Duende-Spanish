import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { shuffleRandom } from "@/lib/games/palabra-vortex/game-utils";

import { challengesForLevel } from "./challenges";
import type { ChallengeDef } from "./types";

export type ShuffledRound = {
  def: ChallengeDef;
  choices: string[];
  correctIndex: number;
};

export function buildBattleDeck(level: PalabraDifficultyLevel): ChallengeDef[] {
  const all = challengesForLevel(level);
  const minions = all.filter((c) => !c.boss);
  const bosses = all.filter((c) => c.boss);
  const pool = shuffleRandom([...minions]);
  if (pool.length === 0) {
    const fallback = shuffleRandom([...all]);
    return [...Array.from({ length: 9 }, (_, i) => fallback[i % fallback.length]), fallback[0]];
  }
  const nine: ChallengeDef[] = [];
  for (let i = 0; i < 9; i++) {
    nine.push(pool[i % pool.length]);
  }
  const boss =
    bosses.length > 0 ? shuffleRandom([...bosses])[0] : pool[Math.min(pool.length - 1, 3)];
  return [...nine, boss];
}

export function shuffleChallengeChoices(def: ChallengeDef): ShuffledRound {
  const choices = shuffleRandom([def.correct, def.wrong[0], def.wrong[1], def.wrong[2]]);
  const correctIndex = choices.indexOf(def.correct);
  return { def, choices, correctIndex };
}
