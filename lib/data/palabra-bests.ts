import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";

const LEVELS: PalabraDifficultyLevel[] = ["easy", "medium", "hard", "expert"];

const EMPTY: Record<PalabraDifficultyLevel, number> = {
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0,
};

export function aggregatePalabraBests(
  rows: { difficulty: string | null; score: number }[] | null,
): Record<PalabraDifficultyLevel, number> {
  const out = { ...EMPTY };
  for (const row of rows ?? []) {
    const d = row.difficulty as PalabraDifficultyLevel;
    if (!LEVELS.includes(d)) continue;
    if (row.score > out[d]) out[d] = row.score;
  }
  return out;
}

/** Max score per CEFR tier for Palabra Vortex (server-only). */
export async function getPalabraPersonalBests(): Promise<Record<PalabraDifficultyLevel, number>> {
  if (!isSupabaseConfigured()) return { ...EMPTY };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...EMPTY };

  const { data } = await supabase
    .from("game_records")
    .select("difficulty, score")
    .eq("user_id", user.id)
    .eq("game_name", "palabra-vortex");

  return aggregatePalabraBests(data ?? []);
}
