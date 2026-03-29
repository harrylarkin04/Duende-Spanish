import type { LocalLeaderEntry } from "@/lib/games/palabra-vortex/types";
import type { ChatProgressSnapshot } from "@/lib/progress/chat-stats-local";

const WEEKS = 12;
const DAYS = WEEKS * 7;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Oldest → newest, length `DAYS` (84), aligned from today backwards. */
export function buildDailyActivityCounts(entries: LocalLeaderEntry[]): number[] {
  const byDay = new Map<string, number>();
  for (const e of entries) {
    const k = e.at.slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const out: number[] = [];
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(byDay.get(dayKey(d)) ?? 0);
  }
  return out;
}

export type SkillBranch = {
  id: "vocabulary" | "grammar" | "speaking" | "listening" | "culture";
  label: string;
  shortLabel: string;
  value: number;
  unlocked: boolean;
};

export type ModeBreakdown = {
  mode: string;
  label: string;
  runs: number;
  bestScore: number;
  bestStreak: number;
};

export type ProgressModel = {
  skillBranches: SkillBranch[];
  fluency: number;
  /** Past 14 days + 7 projected; last historical point matches `fluency`. */
  fluencySeries: { day: string; score: number; projected?: boolean }[];
  heatmapLevels: number[];
  heatmapMax: number;
  modeBreakdown: ModeBreakdown[];
  totals: {
    palabraRuns: number;
    reviewDeckCount: number;
    avgScoreLast10: number;
    maxStreakEver: number;
  };
  chat: ChatProgressSnapshot;
};

export function computeProgressModel(
  leaderboard: LocalLeaderEntry[],
  reviewDeckCount: number,
  chat: ChatProgressSnapshot,
): ProgressModel {
  const runs = leaderboard.length;
  const maxStreakEver = leaderboard.reduce(
    (m, r) => Math.max(m, r.bestStreak),
    0,
  );
  const last10 = leaderboard
    .slice()
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
  const avgScoreLast10 =
    last10.length === 0
      ? 0
      : Math.round(
          last10.reduce((s, r) => s + r.score, 0) / last10.length,
        );

  const sprintRuns = leaderboard.filter((r) => r.mode === "sprint").length;
  const endlessRuns = leaderboard.filter((r) => r.mode === "endless").length;
  const dailyRuns = leaderboard.filter((r) => r.mode === "daily").length;

  const bestSprint = leaderboard
    .filter((r) => r.mode === "sprint")
    .reduce((b, r) => (r.score > (b?.score ?? 0) ? r : b), undefined as LocalLeaderEntry | undefined);
  const bestEndless = leaderboard
    .filter((r) => r.mode === "endless")
    .reduce((b, r) => (r.score > (b?.score ?? 0) ? r : b), undefined as LocalLeaderEntry | undefined);
  const bestDaily = leaderboard
    .filter((r) => r.mode === "daily")
    .reduce((b, r) => (r.score > (b?.score ?? 0) ? r : b), undefined as LocalLeaderEntry | undefined);

  const modeBreakdown: ModeBreakdown[] = [
    {
      mode: "sprint",
      label: "Sprint",
      runs: sprintRuns,
      bestScore: bestSprint?.score ?? 0,
      bestStreak: bestSprint?.bestStreak ?? 0,
    },
    {
      mode: "endless",
      label: "Endless",
      runs: endlessRuns,
      bestScore: bestEndless?.score ?? 0,
      bestStreak: bestEndless?.bestStreak ?? 0,
    },
    {
      mode: "daily",
      label: "Daily",
      runs: dailyRuns,
      bestScore: bestDaily?.score ?? 0,
      bestStreak: bestDaily?.bestStreak ?? 0,
    },
  ];

  const reviewDrag = clamp(reviewDeckCount * 0.35, 0, 18);

  const vocabulary = clamp(
    36 + runs * 1.8 + Math.min(22, Math.floor(avgScoreLast10 / 45)) - reviewDrag,
    8,
    100,
  );
  const grammar = clamp(
    34 + dailyRuns * 3.5 + endlessRuns * 1.2 + Math.min(18, maxStreakEver),
    8,
    100,
  );
  const speaking = clamp(
    32 + chat.userMessagesTotal * 1.4 + chat.voiceTurns * 2.5 + maxStreakEver * 0.8,
    8,
    100,
  );
  const listening = clamp(
    38 + chat.assistantMessagesTotal * 0.9 + endlessRuns * 1.5,
    8,
    100,
  );
  const culture = clamp(
    40 + dailyRuns * 2 + Math.min(25, runs) * 0.6 + chat.userMessagesTotal * 0.4,
    8,
    100,
  );

  const skillBranches: SkillBranch[] = [
    {
      id: "vocabulary",
      label: "Vocabulario",
      shortLabel: "Vocab",
      value: Math.round(vocabulary),
      unlocked: runs > 0 || reviewDeckCount > 0,
    },
    {
      id: "grammar",
      label: "Gramática",
      shortLabel: "Grammar",
      value: Math.round(grammar),
      unlocked: dailyRuns > 0 || endlessRuns > 0,
    },
    {
      id: "speaking",
      label: "Expresión oral",
      shortLabel: "Speak",
      value: Math.round(speaking),
      unlocked: chat.userMessagesTotal > 0 || chat.voiceTurns > 0,
    },
    {
      id: "listening",
      label: "Comprensión",
      shortLabel: "Listen",
      value: Math.round(listening),
      unlocked: chat.assistantMessagesTotal > 0 || endlessRuns > 0,
    },
    {
      id: "culture",
      label: "Cultura",
      shortLabel: "Culture",
      value: Math.round(culture),
      unlocked: dailyRuns > 0 || chat.userMessagesTotal > 0,
    },
  ];

  const fluency = Math.round(
    skillBranches.reduce((s, b) => s + b.value, 0) / skillBranches.length,
  );

  const heatmapLevels = buildDailyActivityCounts(leaderboard);
  const heatmapMax = Math.max(1, ...heatmapLevels);

  const fluencySeries: ProgressModel["fluencySeries"] = [];
  for (let i = 0; i < 14; i++) {
    const daysBack = 13 - i;
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    const day = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    if (i === 13) {
      fluencySeries.push({ day, score: fluency });
    } else {
      const score = clamp(
        Math.round(
          fluency -
            daysBack * 0.42 +
            Math.sin(daysBack * 0.55) * 2.5 +
            (runs > 0 ? 1.2 : -2.5),
        ),
        12,
        98,
      );
      fluencySeries.push({ day, score });
    }
  }

  const trend =
    fluencySeries.length >= 2
      ? fluency - fluencySeries[fluencySeries.length - 2].score
      : 0.9;
  for (let j = 1; j <= 7; j++) {
    const d = new Date();
    d.setDate(d.getDate() + j);
    const next = clamp(
      Math.round(fluency + trend * 0.4 * j + j * 0.25),
      10,
      100,
    );
    fluencySeries.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: next,
      projected: true,
    });
  }

  return {
    skillBranches,
    fluency,
    fluencySeries,
    heatmapLevels,
    heatmapMax,
    modeBreakdown,
    totals: {
      palabraRuns: runs,
      reviewDeckCount,
      avgScoreLast10,
      maxStreakEver,
    },
    chat,
  };
}
