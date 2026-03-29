"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crown, Flame, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { followUser, unfollowUser } from "@/app/(protected)/actions/follow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeaderboardMedal } from "@/components/leaderboards/leaderboard-medal";
import { useLeaderboardLiveRefresh } from "@/hooks/use-supabase-game-sync";
import type { LeaderEntry } from "@/lib/data/leaderboards";
import { cn } from "@/lib/utils";

type ApiPayload = {
  entries: LeaderEntry[];
  followingIds: string[];
  selfId: string;
};

export function ProfileLeaderboardSection({
  initialEntries,
  selfId,
  initialFollowingIds,
}: {
  initialEntries: LeaderEntry[];
  selfId: string;
  initialFollowingIds: string[];
}) {
  const reduce = useReducedMotion() === true;
  const [entries, setEntries] = React.useState(initialEntries);
  const [following, setFollowing] = React.useState(() => new Set(initialFollowingIds));
  const [loading, setLoading] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboards?board=fluency&scope=global&window=all", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const j = (await res.json()) as ApiPayload;
      setEntries(j.entries.slice(0, 8));
      setFollowing(new Set(j.followingIds));
    } finally {
      setLoading(false);
    }
  }, []);

  useLeaderboardLiveRefresh(() => {
    void load();
  });

  async function toggleFollow(targetId: string, isFollowing: boolean) {
    setPending(targetId);
    const res = isFollowing ? await unfollowUser(targetId) : await followUser(targetId);
    setPending(null);
    if (res.ok) void load();
  }

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-10"
    >
      <Card className="border-fiesta-gold/25 bg-linear-to-br from-fiesta-crimson/12 to-card/90">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="size-5 text-fiesta-gold" />
              Top fluidez global
            </CardTitle>
            <CardDescription>En vivo con Supabase — seguí rivales desde cada fila.</CardDescription>
          </div>
          <Link
            href="/leaderboards"
            className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] border border-fiesta-gold/30 bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted"
          >
            Ver tableros
          </Link>
        </CardHeader>
        <CardContent>
          {loading && entries.length === 0 && (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
          <ul className="space-y-2">
            {entries.map((e) => {
              const isSelf = e.userId === selfId;
              const hot = e.rank <= 3;
              return (
                <li
                  key={e.userId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2",
                    isSelf ? "border-fiesta-gold/45 bg-fiesta-crimson/20" : "border-border/60 bg-background/50",
                  )}
                >
                  <LeaderboardMedal rank={e.rank} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.username ?? "Explorador"}
                      {isSelf && <span className="ml-1 text-fiesta-gold">(vos)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{Math.round(e.value)} pts</p>
                  </div>
                  {hot && (
                    <motion.span
                      className="text-fiesta-orange"
                      animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      aria-hidden
                    >
                      <Flame className="size-4" />
                    </motion.span>
                  )}
                  {!isSelf && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      className="shrink-0"
                      disabled={pending === e.userId}
                      onClick={() => void toggleFollow(e.userId, following.has(e.userId))}
                    >
                      {pending === e.userId ? "…" : following.has(e.userId) ? "Dejar" : "Seguir"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </motion.section>
  );
}
