"use client";

import * as React from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Refreshes server-backed UI when this user's profile or new game rows change (Supabase Realtime).
 * Call `onRefresh` with router.refresh() or a custom refetch.
 */
export function useRealtimeProfileGameSync(onRefresh: () => void) {
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onRefresh();
    }, 450);
  }, [onRefresh]);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user.id) return;
      const uid = session.user.id;
      channel = supabase
        .channel(`profile-game-sync:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `user_id=eq.${uid}` },
          fire,
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "game_records", filter: `user_id=eq.${uid}` },
          fire,
        )
        .subscribe();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user.id) return;
      fire();
    });

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, [fire]);
}

export function useLeaderboardLiveRefresh(onRefresh: () => void) {
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = React.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onRefresh();
    }, 500);
  }, [onRefresh]);

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const ch = supabase
      .channel("leaderboards-global")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fire)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_records" }, fire)
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(ch);
    };
  }, [fire]);
}
