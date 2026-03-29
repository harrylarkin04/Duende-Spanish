"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseBadgeJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    return Array.isArray(j) ? j.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

type CityId = "madrid" | "cdmx" | "ba";
const CITIES = new Set<string>(["madrid", "cdmx", "ba"]);

function isCity(s: string): s is CityId {
  return CITIES.has(s);
}

export type RecordCultureQuestResult =
  | { ok: true; souvenirs: string[] }
  | { ok: false; error: string };

export async function recordCultureQuest(payload: {
  city: string;
  endingTier: "bad" | "good" | "legendary";
  score: number;
  souvenirs: string[];
}): Promise<RecordCultureQuestResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };
  if (!isCity(payload.city)) return { ok: false, error: "Ciudad inválida" };
  const tier = payload.endingTier;
  if (tier !== "bad" && tier !== "good" && tier !== "legendary") {
    return { ok: false, error: "Final inválido" };
  }

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

  const snapshot = JSON.stringify({
    city: payload.city,
    ending: tier,
    at: new Date().toISOString(),
  });

  const { error: insertErr } = await supabase.from("game_records").insert({
    user_id: user.id,
    game_name: "culture-quest",
    score: Math.max(0, Math.min(100, Math.round(payload.score))),
    difficulty: payload.city,
    culture_quest_snapshot: snapshot,
  });

  if (insertErr) {
    if (insertErr.message.includes("culture_quest_snapshot") || insertErr.code === "PGRST204") {
      const { error: retry } = await supabase.from("game_records").insert({
        user_id: user.id,
        game_name: "culture-quest",
        score: Math.max(0, Math.min(100, Math.round(payload.score))),
        difficulty: payload.city,
      });
      if (retry) return { ok: false, error: retry.message };
    } else {
      return { ok: false, error: insertErr.message };
    }
  }

  const existingBadges = parseBadgeJson(profile?.culture_badges);
  const merged = [...new Set([...existingBadges, ...payload.souvenirs])];

  const { data: cqRows } = await supabase
    .from("game_records")
    .select("culture_quest_snapshot, difficulty")
    .eq("user_id", user.id)
    .eq("game_name", "culture-quest");

  const visited = new Set<CityId>();
  for (const row of cqRows ?? []) {
    const snap = row.culture_quest_snapshot;
    if (typeof snap === "string" && snap) {
      try {
        const o = JSON.parse(snap) as { city?: string };
        const oc = o.city;
        if (typeof oc === "string" && isCity(oc)) visited.add(oc);
      } catch {
        /* ignore */
      }
    }
    if (row.difficulty && isCity(row.difficulty)) visited.add(row.difficulty);
  }
  visited.add(payload.city);
  if (visited.size >= 3) merged.push("cq-globetrotter");

  const uniqueSouvenirs = [...new Set(merged)];

  const { count: totalGames } = await supabase
    .from("game_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const n = Math.max(1, totalGames ?? 1);
  const prevFluency = profile?.total_fluency_score ?? 0;
  const scoreNorm = Math.max(0, Math.min(100, Math.round(payload.score)));
  const blended = Math.round(Math.min(100, (prevFluency * (n - 1) + scoreNorm) / n));
  const longest = Math.max(newStreak, profile?.longest_streak ?? 0);

  const { error: upErr } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      username: profile?.username ?? null,
      avatar_url: profile?.avatar_url ?? null,
      current_streak: newStreak,
      longest_streak: longest,
      total_fluency_score: blended,
      created_at: profile?.created_at ?? new Date().toISOString(),
      culture_badges: JSON.stringify(uniqueSouvenirs),
    },
    { onConflict: "user_id" },
  );

  if (upErr) {
    if (upErr.message.includes("culture_badges") || upErr.code === "PGRST204") {
      const { error: retryP } = await supabase.from("profiles").upsert(
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
      if (retryP) return { ok: false, error: retryP.message };
    } else {
      return { ok: false, error: upErr.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/progress");
  revalidatePath("/games");
  revalidatePath("/games/culture-quest");
  revalidatePath("/leaderboards");

  return { ok: true, souvenirs: uniqueSouvenirs };
}
