"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  if (!isSupabaseConfigured()) return { ok: false as const, error: "Supabase no configurado" };

  const username = String(formData.get("username") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const dialect = String(formData.get("preferred_dialect") ?? "").trim();
  const difficulty = String(formData.get("difficulty_preference") ?? "").trim();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "No autenticado" };

  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      avatar_url: avatarUrl || null,
    })
    .eq("user_id", user.id);

  if (pErr) return { ok: false as const, error: pErr.message };

  const { error: prefErr } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      preferred_dialect: dialect || null,
      difficulty_preference: difficulty || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (prefErr) return { ok: false as const, error: prefErr.message };

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/leaderboards");

  return { ok: true as const };
}
