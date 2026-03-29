import "server-only";

import { getFriendsStreaks, getWeeklyGamesRank } from "@/lib/data/leaderboards";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { weekStartUtcIso } from "@/lib/time/week";

export type FriendStreakPreview = {
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  currentStreak: number;
};

export type DashboardSnapshot = {
  username: string | null;
  avatarUrl: string | null;
  fluency: number;
  currentStreak: number;
  longestStreak: number;
  gamesPlayed: number;
  wordsSaved: number;
  weeklyPercent: number;
  /** Competition rank by games played this week (UTC Monday); null if no plays yet */
  weeklyRank: number | null;
  gamesThisWeek: number;
  weekStartsAt: string;
  friendsStreaks: FriendStreakPreview[];
};

const empty: DashboardSnapshot = {
  username: null,
  avatarUrl: null,
  fluency: 0,
  currentStreak: 0,
  longestStreak: 0,
  gamesPlayed: 0,
  wordsSaved: 0,
  weeklyPercent: 0,
  weeklyRank: null,
  gamesThisWeek: 0,
  weekStartsAt: weekStartUtcIso(),
  friendsStreaks: [],
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured()) return empty;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const { data: profile } = await supabase
    .from("profiles")
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

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: weekGames } = await supabase
    .from("game_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("played_at", weekAgo.toISOString());

  const goal = 5;
  const weeklyPercent = Math.min(100, Math.round(((weekGames ?? 0) / goal) * 100));

  const [weeklyBoard, friendsStreaks] = await Promise.all([
    getWeeklyGamesRank(user.id),
    getFriendsStreaks(user.id, 12),
  ]);

  return {
    username: profile?.username ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    fluency: profile?.total_fluency_score ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    gamesPlayed: gamesPlayed ?? 0,
    wordsSaved: wordsSaved ?? 0,
    weeklyPercent,
    weeklyRank: weeklyBoard.rank,
    gamesThisWeek: weeklyBoard.gamesThisWeek,
    weekStartsAt: weeklyBoard.weekStartsAt,
    friendsStreaks,
  };
}
