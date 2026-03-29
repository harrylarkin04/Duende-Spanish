"use server";

import { revalidatePath } from "next/cache";

import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const LEVELS: PalabraDifficultyLevel[] = ["easy", "medium", "hard", "expert"];

function isLevel(d: string): d is PalabraDifficultyLevel {
  return LEVELS.includes(d as PalabraDifficultyLevel);
}

export async function recordListeningDuel(payload: {
  score: number;
  difficulty: PalabraDifficultyLevel;
  correctCount: number;
  totalRounds: number;
  /** Topic ids where the player missed at least one question */
  struggledTopics: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };
  if (!isLevel(payload.difficulty)) return { ok: false, error: "Dificultad inválida" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

  const { data: prior } = await supabase
    .from("game_records")
    .select("played_at")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const todayK = dayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = dayKey(yesterday);

  let newStreak = profile?.current_streak ?? 0;
  if (!prior) {
    newStreak = 1;
  } else {
    const pk = dayKey(new Date(prior.played_at));
    if (pk === todayK) {
      newStreak = Math.max(1, profile?.current_streak ?? 1);
    } else if (pk === yKey) {
      newStreak = (profile?.current_streak ?? 0) + 1;
    } else {
      newStreak = 1;
    }
  }

  const topicsJson = JSON.stringify([...new Set(payload.struggledTopics)]);

  const { error: insertErr } = await supabase.from("game_records").insert({
    user_id: user.id,
    game_name: "listening-duel",
    score: payload.score,
    difficulty: payload.difficulty,
    correct_count: payload.correctCount,
    total_questions: payload.totalRounds,
    listening_topics: topicsJson,
  });

  if (insertErr) {
    if (insertErr.message.includes("listening_topics") || insertErr.code === "PGRST204") {
      const { error: retry } = await supabase.from("game_records").insert({
        user_id: user.id,
        game_name: "listening-duel",
        score: payload.score,
        difficulty: payload.difficulty,
        correct_count: payload.correctCount,
        total_questions: payload.totalRounds,
      });
      if (retry) return { ok: false, error: retry.message };
    } else {
      return { ok: false, error: insertErr.message };
    }
  }

  const { count: totalGames } = await supabase
    .from("game_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const n = Math.max(1, totalGames ?? 1);
  const prevFluency = profile?.total_fluency_score ?? 0;
  const scoreNorm = Math.min(100, Math.round((payload.score / 3500) * 100));
  const blended = Math.round(Math.min(100, (prevFluency * (n - 1) + scoreNorm) / n));
  const longest = Math.max(newStreak, profile?.longest_streak ?? 0);

  await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      current_streak: newStreak,
      longest_streak: longest,
      total_fluency_score: blended,
      created_at: profile?.created_at ?? new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/progress");
  revalidatePath("/games");
  revalidatePath("/games/listening-duel");
  revalidatePath("/leaderboards");

  return { ok: true };
}
