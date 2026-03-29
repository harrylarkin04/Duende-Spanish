import type { GameModeKind, LocalLeaderEntry, PalabraDifficultyLevel } from "./types";

const STORAGE_KEY = "duende.palabra-vortex.leaderboard-v2";

function read(): LocalLeaderEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is LocalLeaderEntry =>
        row != null &&
        typeof row === "object" &&
        typeof (row as LocalLeaderEntry).score === "number" &&
        typeof (row as LocalLeaderEntry).bestStreak === "number" &&
        typeof (row as LocalLeaderEntry).at === "string" &&
        ["sprint", "endless", "daily"].includes((row as LocalLeaderEntry).mode) &&
        ((row as LocalLeaderEntry).difficulty == null ||
          ["easy", "medium", "hard", "expert"].includes(String((row as LocalLeaderEntry).difficulty))),
    );
  } catch {
    return [];
  }
}

function write(rows: LocalLeaderEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-50)));
  } catch {
    /* ignore */
  }
}

export function recordLocalScore(
  mode: GameModeKind,
  score: number,
  bestStreak: number,
  difficulty: PalabraDifficultyLevel,
) {
  const rows = read();
  rows.push({
    mode,
    difficulty,
    score,
    bestStreak,
    at: new Date().toISOString(),
  });
  write(rows);
}

export function getLocalLeaderboard(): LocalLeaderEntry[] {
  return read().sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export function getBestForMode(mode: GameModeKind): LocalLeaderEntry | undefined {
  const rows = read().filter((r) => r.mode === mode);
  return rows.reduce<LocalLeaderEntry | undefined>((best, r) => {
    if (!best || r.score > best.score) return r;
    return best;
  }, undefined);
}

export function getBestForDifficulty(difficulty: PalabraDifficultyLevel): LocalLeaderEntry | undefined {
  const rows = read().filter((r) => r.difficulty === difficulty);
  return rows.reduce<LocalLeaderEntry | undefined>((best, r) => {
    if (!best || r.score > best.score) return r;
    return best;
  }, undefined);
}
