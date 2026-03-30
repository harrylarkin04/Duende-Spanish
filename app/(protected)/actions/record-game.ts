"use server";

import { revalidatePath } from "next/cache";

import { aggregatePalabraBests } from "@/lib/data/palabra-bests";
import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type PalabraVocabResult = {
  spanish: string;
  english: string;
  correct: boolean;
};

export type RecordPalabraResult =
  | {
      ok: true;
      newPersonalBest: boolean;
      bestsByDifficulty: Record<PalabraDifficultyLevel, number>;
    }
  | { ok: false; error: string };

const LEVELS: PalabraDifficultyLevel[] = ["easy", "medium", "hard", "expert"];

function isLevel(d: string): d is PalabraDifficultyLevel {
  return LEVELS.includes(d as PalabraDifficultyLevel);
}

async function applyVocabMastery(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  results: PalabraVocabResult[],
) {
  const merged = new Map<string, PalabraVocabResult>();
  for (const r of results.slice(-200)) {
    const key = r.spanish.trim().toLowerCase();
    merged.set(key, r);
  }

  for (const r of merged.values()) {
    const { data: existing } = await supabase
      .from("saved_vocab")
      .select("mastery_level")
      .eq("user_id", userId)
      .eq("spanish_word", r.spanish)
      .maybeSingle();

    const prev = existing?.mastery_level ?? 0;
    const next = r.correct ? Math.min(5, prev + 1) : Math.max(0, prev - 1);

    const { error } = await supabase.from("saved_vocab").upsert(
      {
        user_id: userId,
        spanish_word: r.spanish,
        english_translation: r.english,
        last_reviewed: new Date().toISOString(),
        mastery_level: next,
      },
      { onConflict: "user_id,spanish_word" },
    );
    if (error) {
      console.error("[recordPalabraRun] saved_vocab upsert", error.message);
    }
  }
}

export async function recordPalabraRun(payload: {
  score: number;
  /** sprint | endless | daily — for analytics only; not stored when CEFR difficulty is set */
  gameMode: string;
  difficulty: PalabraDifficultyLevel;
  correctCount: number;
  totalQuestions: number;
  vocabResults: PalabraVocabResult[];
  /** Defaults to palabra-vortex so personal bests stay single-player only */
  gameRecordName?: string;
}): Promise<RecordPalabraResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };
  if (!isLevel(payload.difficulty)) return { ok: false, error: "Dificultad inválida" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

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

  const gameRecordName = payload.gameRecordName ?? "palabra-vortex";

  const { data: prevBestRow } = await supabase
    .from("game_records")
    .select("score")
    .eq("user_id", user.id)
    .eq("game_name", gameRecordName)
    .eq("difficulty", payload.difficulty)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevBest = prevBestRow?.score ?? 0;
  const newPersonalBest = payload.score > prevBest;

  const { error: insertErr } = await supabase.from("game_records").insert({
    user_id: user.id,
    game_name: gameRecordName,
    score: payload.score,
    difficulty: payload.difficulty,
    correct_count: payload.correctCount,
    total_questions: payload.totalQuestions,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  await applyVocabMastery(supabase, user.id, payload.vocabResults);

  const { count: totalGames } = await supabase
    .from("game_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const n = Math.max(1, totalGames ?? 1);
  const prevFluency = profile?.total_fluency_score ?? 0;
  const blended = Math.round(
    Math.min(100, (prevFluency * (n - 1) + Math.min(100, payload.score)) / n),
  );
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

  const { data: allRows } = await supabase
    .from("game_records")
    .select("difficulty, score")
    .eq("user_id", user.id)
    .eq("game_name", "palabra-vortex");

  const bestsByDifficulty = aggregatePalabraBests(allRows ?? []);

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/progress");
  revalidatePath("/games/palabra-vortex");
  revalidatePath("/games/palabra-vortex/multiplayer");
  revalidatePath("/leaderboards");

  return { ok: true, newPersonalBest, bestsByDifficulty };
}
