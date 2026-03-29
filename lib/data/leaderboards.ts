import "server-only";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { weekStartUtcIso } from "@/lib/time/week";

import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";

export type LeaderboardScope = "global" | "friends";
export type LeaderboardWindow = "all" | "week";

export type LeaderEntry = {
  rank: number;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  /** Primary metric for the board */
  value: number;
  /** Secondary line (e.g. games this week) */
  sublabel?: string;
};

const TOP_LIMIT = 50;

function assignRanks(sorted: { userId: string; value: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  let r = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]!.value < sorted[i - 1]!.value) {
      r = i + 1;
    }
    m.set(sorted[i]!.userId, r);
  }
  return m;
}

async function followingIds(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) {
  const { data } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId);
  return (data ?? []).map((r) => r.following_id);
}

async function activeUserIdsThisWeek(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  since: string,
): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("leaderboard_weekly_activity", { p_since: since });
  if (error) {
    console.error("[leaderboard_weekly_activity]", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.user_id));
}

async function loadProfiles(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userIds: string[],
): Promise<Map<string, { username: string | null; avatar_url: string | null; total_fluency_score: number; current_streak: number }>> {
  const map = new Map<
    string,
    { username: string | null; avatar_url: string | null; total_fluency_score: number; current_streak: number }
  >();
  if (userIds.length === 0) return map;

  const chunk = 200;
  for (let i = 0; i < userIds.length; i += chunk) {
    const slice = userIds.slice(i, i + chunk);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_url, total_fluency_score, current_streak")
      .in("user_id", slice);
    for (const p of data ?? []) {
      map.set(p.user_id, {
        username: p.username,
        avatar_url: p.avatar_url,
        total_fluency_score: p.total_fluency_score,
        current_streak: p.current_streak,
      });
    }
  }
  return map;
}

function filterScope(
  scope: LeaderboardScope,
  window: LeaderboardWindow,
  selfId: string,
  friendIds: string[],
  weekActive: Set<string>,
  userId: string,
): boolean {
  if (scope === "friends") {
    const allowed = new Set([selfId, ...friendIds]);
    if (!allowed.has(userId)) return false;
  }
  if (window === "week" && !weekActive.has(userId)) return false;
  return true;
}

export type LeaderboardResult = {
  entries: LeaderEntry[];
  myRank: number | null;
  weekStartsAt: string | null;
};

export async function fetchFluencyLeaderboard(
  selfId: string,
  scope: LeaderboardScope,
  window: LeaderboardWindow,
): Promise<LeaderboardResult> {
  if (!isSupabaseConfigured()) return { entries: [], myRank: null, weekStartsAt: null };

  const supabase = await createServerSupabaseClient();
  const weekStart = weekStartUtcIso();
  const friends = scope === "friends" ? await followingIds(supabase, selfId) : [];
  const weekActive = window === "week" ? await activeUserIdsThisWeek(supabase, weekStart) : null;

  const { data: allProfiles, error } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url, total_fluency_score, current_streak")
    .order("total_fluency_score", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[fluency leaderboard]", error.message);
    return { entries: [], myRank: null, weekStartsAt: window === "week" ? weekStart : null };
  }

  const rows = (allProfiles ?? []).filter((p) =>
    filterScope(scope, window, selfId, friends, weekActive ?? new Set(), p.user_id),
  );

  const sorted = [...rows].sort((a, b) => b.total_fluency_score - a.total_fluency_score);
  const rankMap = assignRanks(sorted.map((p) => ({ userId: p.user_id, value: p.total_fluency_score })));

  const entries: LeaderEntry[] = sorted.slice(0, TOP_LIMIT).map((p) => ({
    rank: rankMap.get(p.user_id) ?? 0,
    userId: p.user_id,
    username: p.username,
    avatarUrl: p.avatar_url,
    value: p.total_fluency_score,
  }));

  const myRank = rankMap.get(selfId) ?? null;

  return { entries, myRank, weekStartsAt: window === "week" ? weekStart : null };
}

export async function fetchPalabraLeaderboard(
  selfId: string,
  difficulty: PalabraDifficultyLevel,
  scope: LeaderboardScope,
  window: LeaderboardWindow,
): Promise<LeaderboardResult> {
  if (!isSupabaseConfigured()) return { entries: [], myRank: null, weekStartsAt: null };

  const supabase = await createServerSupabaseClient();
  const weekStart = weekStartUtcIso();
  const friends = scope === "friends" ? await followingIds(supabase, selfId) : [];
  const weekActive = window === "week" ? await activeUserIdsThisWeek(supabase, weekStart) : null;

  const { data: bests, error } = await supabase.rpc("leaderboard_palabra_bests", {
    p_difficulty: difficulty,
    p_since: window === "week" ? weekStart : null,
  });

  if (error) {
    console.error("[palabra leaderboard]", error.message);
    return { entries: [], myRank: null, weekStartsAt: window === "week" ? weekStart : null };
  }

  const raw = (bests ?? []).filter((r) =>
    filterScope(scope, window, selfId, friends, weekActive ?? new Set(), r.user_id),
  );

  const sorted = [...raw].sort((a, b) => b.best_score - a.best_score);
  const rankMap = assignRanks(sorted.map((r) => ({ userId: r.user_id, value: r.best_score })));

  const ids = sorted.slice(0, TOP_LIMIT).map((r) => r.user_id);
  const profiles = await loadProfiles(supabase, ids);

  const entries: LeaderEntry[] = sorted.slice(0, TOP_LIMIT).map((r) => {
    const p = profiles.get(r.user_id);
    return {
      rank: rankMap.get(r.user_id) ?? 0,
      userId: r.user_id,
      username: p?.username ?? null,
      avatarUrl: p?.avatar_url ?? null,
      value: r.best_score,
    };
  });

  const myRank = rankMap.get(selfId) ?? null;

  return { entries, myRank, weekStartsAt: window === "week" ? weekStart : null };
}

export async function fetchGrammarWinsLeaderboard(
  selfId: string,
  scope: LeaderboardScope,
  window: LeaderboardWindow,
): Promise<LeaderboardResult> {
  if (!isSupabaseConfigured()) return { entries: [], myRank: null, weekStartsAt: null };

  const supabase = await createServerSupabaseClient();
  const weekStart = weekStartUtcIso();
  const friends = scope === "friends" ? await followingIds(supabase, selfId) : [];
  const weekActive = window === "week" ? await activeUserIdsThisWeek(supabase, weekStart) : null;

  const { data: wins, error } = await supabase.rpc("leaderboard_grammar_wins", {
    p_since: window === "week" ? weekStart : null,
  });

  if (error) {
    console.error("[grammar wins leaderboard]", error.message);
    return { entries: [], myRank: null, weekStartsAt: window === "week" ? weekStart : null };
  }

  const toNum = (w: number | string) => (typeof w === "string" ? Number.parseInt(w, 10) : w);

  const raw = (wins ?? []).filter((r) =>
    filterScope(scope, window, selfId, friends, weekActive ?? new Set(), r.user_id),
  );

  const sorted = [...raw].sort((a, b) => toNum(b.wins) - toNum(a.wins));
  const rankMap = assignRanks(sorted.map((r) => ({ userId: r.user_id, value: toNum(r.wins) })));

  const ids = sorted.slice(0, TOP_LIMIT).map((r) => r.user_id);
  const profiles = await loadProfiles(supabase, ids);

  const entries: LeaderEntry[] = sorted.slice(0, TOP_LIMIT).map((r) => {
    const n = toNum(r.wins);
    const p = profiles.get(r.user_id);
    return {
      rank: rankMap.get(r.user_id) ?? 0,
      userId: r.user_id,
      username: p?.username ?? null,
      avatarUrl: p?.avatar_url ?? null,
      value: n,
      sublabel: n === 1 ? "victoria" : "victorias",
    };
  });

  const myRank = rankMap.get(selfId) ?? null;

  return { entries, myRank, weekStartsAt: window === "week" ? weekStart : null };
}

export async function fetchStreakLeaderboard(
  selfId: string,
  scope: LeaderboardScope,
  window: LeaderboardWindow,
): Promise<LeaderboardResult> {
  if (!isSupabaseConfigured()) return { entries: [], myRank: null, weekStartsAt: null };

  const supabase = await createServerSupabaseClient();
  const weekStart = weekStartUtcIso();
  const friends = scope === "friends" ? await followingIds(supabase, selfId) : [];
  const weekActive = window === "week" ? await activeUserIdsThisWeek(supabase, weekStart) : null;

  const { data: allProfiles, error } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url, total_fluency_score, current_streak")
    .order("current_streak", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[streak leaderboard]", error.message);
    return { entries: [], myRank: null, weekStartsAt: window === "week" ? weekStart : null };
  }

  const rows = (allProfiles ?? []).filter((p) =>
    filterScope(scope, window, selfId, friends, weekActive ?? new Set(), p.user_id),
  );

  const sorted = [...rows].sort((a, b) => b.current_streak - a.current_streak);
  const rankMap = assignRanks(sorted.map((p) => ({ userId: p.user_id, value: p.current_streak })));

  const entries: LeaderEntry[] = sorted.slice(0, TOP_LIMIT).map((p) => ({
    rank: rankMap.get(p.user_id) ?? 0,
    userId: p.user_id,
    username: p.username,
    avatarUrl: p.avatar_url,
    value: p.current_streak,
    sublabel: "días",
  }));

  const myRank = rankMap.get(selfId) ?? null;

  return { entries, myRank, weekStartsAt: window === "week" ? weekStart : null };
}

/** Top-N fluency for profile preview */
export async function fetchFluencyTop(limit: number): Promise<LeaderEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url, total_fluency_score")
    .order("total_fluency_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[fluency top]", error.message);
    return [];
  }

  const sorted = data ?? [];
  const rankMap = assignRanks(sorted.map((p) => ({ userId: p.user_id, value: p.total_fluency_score })));

  return sorted.map((p) => ({
    rank: rankMap.get(p.user_id) ?? 0,
    userId: p.user_id,
    username: p.username,
    avatarUrl: p.avatar_url,
    value: p.total_fluency_score,
  }));
}

export type WeeklyRankResult = {
  rank: number | null;
  gamesThisWeek: number;
  weekStartsAt: string;
};

export async function getWeeklyGamesRank(selfId: string): Promise<WeeklyRankResult> {
  const empty: WeeklyRankResult = { rank: null, gamesThisWeek: 0, weekStartsAt: weekStartUtcIso() };
  if (!isSupabaseConfigured()) return empty;

  const supabase = await createServerSupabaseClient();
  const weekStart = weekStartUtcIso();

  const { data: activity, error } = await supabase.rpc("leaderboard_weekly_activity", { p_since: weekStart });
  if (error) {
    console.error("[weekly activity]", error.message);
    return empty;
  }

  const toNum = (n: number | string) => (typeof n === "string" ? Number.parseInt(n, 10) : n);

  const { count: myCount } = await supabase
    .from("game_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", selfId)
    .gte("played_at", weekStart);

  const list = (activity ?? []).map((r) => ({
    userId: r.user_id,
    games: toNum(r.games_played),
  }));

  const gamesThisWeek = myCount ?? 0;

  const ids = list.map((r) => r.userId);
  const profiles = await loadProfiles(supabase, ids);

  const sorted = [...list].sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games;
    const fa = profiles.get(a.userId)?.total_fluency_score ?? 0;
    const fb = profiles.get(b.userId)?.total_fluency_score ?? 0;
    return fb - fa;
  });

  const rankMap = assignRanks(sorted.map((r) => ({ userId: r.userId, value: r.games })));
  const myRank = rankMap.get(selfId) ?? null;

  return { rank: myRank, gamesThisWeek, weekStartsAt: weekStart };
}

export type FriendStreakRow = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  currentStreak: number;
};

export async function getFriendsStreaks(selfId: string, limit: number): Promise<FriendStreakRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createServerSupabaseClient();
  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", selfId);

  const ids = (follows ?? []).map((f) => f.following_id);
  if (ids.length === 0) return [];

  const { data: profs } = await supabase
    .from("profiles")
    .select("user_id, username, avatar_url, current_streak")
    .in("user_id", ids)
    .order("current_streak", { ascending: false })
    .limit(limit);

  return (profs ?? []).map((p) => ({
    userId: p.user_id,
    username: p.username,
    avatarUrl: p.avatar_url,
    currentStreak: p.current_streak,
  }));
}
