"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function followUser(followingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };
  if (!followingId) return { ok: false, error: "Usuario inválido" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  if (user.id === followingId) return { ok: false, error: "No podés seguirte a vos mismo" };

  const { error } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) {
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }

  revalidatePath("/leaderboards");
  revalidatePath("/profile");
  revalidatePath("/");

  return { ok: true };
}

export async function unfollowUser(followingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado" };

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/leaderboards");
  revalidatePath("/profile");
  revalidatePath("/");

  return { ok: true };
}
