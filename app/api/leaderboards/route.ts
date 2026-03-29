import { NextResponse } from "next/server";

import {
  fetchFluencyLeaderboard,
  fetchGrammarWinsLeaderboard,
  fetchPalabraLeaderboard,
  fetchStreakLeaderboard,
} from "@/lib/data/leaderboards";
import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

const LEVELS: PalabraDifficultyLevel[] = ["easy", "medium", "hard", "expert"];

function isLevel(s: string): s is PalabraDifficultyLevel {
  return LEVELS.includes(s as PalabraDifficultyLevel);
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const url = new URL(req.url);
  const board = url.searchParams.get("board") ?? "fluency";
  const scope = url.searchParams.get("scope") === "friends" ? "friends" : "global";
  const window = url.searchParams.get("window") === "week" ? "week" : "all";
  const difficultyParam = url.searchParams.get("difficulty") ?? "easy";
  const difficulty = isLevel(difficultyParam) ? difficultyParam : "easy";

  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (follows ?? []).map((r) => r.following_id);

  let payload: Awaited<ReturnType<typeof fetchFluencyLeaderboard>>;

  switch (board) {
    case "palabra":
      payload = await fetchPalabraLeaderboard(user.id, difficulty, scope, window);
      break;
    case "grammar":
      payload = await fetchGrammarWinsLeaderboard(user.id, scope, window);
      break;
    case "streak":
      payload = await fetchStreakLeaderboard(user.id, scope, window);
      break;
    case "fluency":
    default:
      payload = await fetchFluencyLeaderboard(user.id, scope, window);
  }

  return NextResponse.json({
    ...payload,
    board,
    scope,
    window,
    difficulty: board === "palabra" ? difficulty : undefined,
    followingIds,
    selfId: user.id,
  });
}
