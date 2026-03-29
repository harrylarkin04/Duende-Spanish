import "server-only";

import { fetchFluencyTop, type LeaderEntry } from "@/lib/data/leaderboards";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type GameHighScore = {
  game_name: string;
  best_score: number;
  plays: number;
};

function parseCultureBadges(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const j = JSON.parse(raw) as unknown;
    return Array.isArray(j) ? j.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export type ProfilePageData = {
  userId: string;
  email: string | null;
  profile: {
    username: string | null;
    avatar_url: string | null;
    total_fluency_score: number;
    current_streak: number;
    longest_streak: number;
    created_at: string;
  } | null;
  /** Souvenirs from Culture Quest (and related), parsed from `profiles.culture_badges`. */
  cultureBadges: string[];
  preferences: {
    preferred_dialect: string | null;
    difficulty_preference: string | null;
  } | null;
  gamesPlayed: number;
  wordsSaved: number;
  highScores: GameHighScore[];
  leaderboardPreview: LeaderEntry[];
  followingIds: string[];
};

export async function getProfilePageData(): Promise<ProfilePageData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { count: gamesPlayed } = await supabase
    .from("game_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: wordsSaved } = await supabase
    .from("saved_vocab")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: records } = await supabase
    .from("game_records")
    .select("game_name, score")
    .eq("user_id", user.id);

  const byGame = new Map<string, { best: number; n: number }>();
  for (const r of records ?? []) {
    const cur = byGame.get(r.game_name) ?? { best: 0, n: 0 };
    cur.best = Math.max(cur.best, r.score);
    cur.n += 1;
    byGame.set(r.game_name, cur);
  }

  const highScores: GameHighScore[] = [...byGame.entries()].map(([game_name, v]) => ({
    game_name,
    best_score: v.best,
    plays: v.n,
  }));

  const { data: followsRows, error: followsErr } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds =
    followsErr || !followsRows ? [] : followsRows.map((r) => r.following_id);

  const leaderboardPreview = await fetchFluencyTop(8);

  return {
    userId: user.id,
    email: user.email ?? null,
    profile,
    cultureBadges: parseCultureBadges(
      profile && typeof profile === "object" && "culture_badges" in profile
        ? (profile as { culture_badges?: string }).culture_badges
        : undefined,
    ),
    preferences: prefs,
    gamesPlayed: gamesPlayed ?? 0,
    wordsSaved: wordsSaved ?? 0,
    highScores,
    leaderboardPreview,
    followingIds,
  };
}
