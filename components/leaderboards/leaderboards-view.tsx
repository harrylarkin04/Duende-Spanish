"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crown, Flame, Globe, Loader2, Users, CalendarRange } from "lucide-react";
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
import type { LeaderEntry, LeaderboardResult } from "@/lib/data/leaderboards";
import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/words";
import { cn } from "@/lib/utils";

type BoardId = "fluency" | "palabra" | "grammar" | "streak";

type ApiPayload = LeaderboardResult & {
  board: string;
  scope: string;
  window: string;
  difficulty?: string;
  followingIds: string[];
  selfId: string;
};

function formatValue(board: BoardId, e: LeaderEntry): string {
  if (board === "grammar") {
    const n = Math.round(e.value);
    return `${n} ${n === 1 ? "victoria" : "victorias"}`;
  }
  if (board === "streak") return `${Math.round(e.value)} días`;
  if (board === "fluency") return `${Math.round(e.value)} pts`;
  return `${Math.round(e.value)}`;
}

export function LeaderboardsView() {
  const reduce = useReducedMotion() === true;
  const [board, setBoard] = React.useState<BoardId>("fluency");
  const [scope, setScope] = React.useState<"global" | "friends">("global");
  const [window, setWindow] = React.useState<"all" | "week">("all");
  const [difficulty, setDifficulty] = React.useState<PalabraDifficultyLevel>("easy");
  const [data, setData] = React.useState<ApiPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [pendingFollow, setPendingFollow] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    const q = new URLSearchParams();
    q.set("board", board);
    q.set("scope", scope);
    q.set("window", window);
    if (board === "palabra") q.set("difficulty", difficulty);
    try {
      const res = await fetch(`/api/leaderboards?${q.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? res.statusText);
      }
      const json = (await res.json()) as ApiPayload;
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al cargar");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [board, scope, window, difficulty]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useLeaderboardLiveRefresh(() => {
    void load();
  });

  async function toggleFollow(targetId: string, isFollowing: boolean) {
    setPendingFollow(targetId);
    const res = isFollowing ? await unfollowUser(targetId) : await followUser(targetId);
    setPendingFollow(null);
    if (res.ok) void load();
  }

  const followingSet = new Set(data?.followingIds ?? []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Crown className="size-3.5" />
          Tableros globales
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Leaderboards
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fluidez, Palabra Vortex, victorias en Grammar y rachas — actualizado en vivo con Supabase.
        </p>
      </motion.div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["fluency", "Fluidez"],
            ["palabra", "Palabra"],
            ["grammar", "Grammar"],
            ["streak", "Rachas"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={board === id ? "default" : "outline"}
            className={cn(board === id && "shadow-md shadow-fiesta-gold/15")}
            onClick={() => setBoard(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {board === "palabra" && (
        <div className="mb-4 flex flex-wrap gap-2">
          {DIFFICULTY_ORDER.map((d) => (
            <Button
              key={d}
              type="button"
              size="xs"
              variant={difficulty === d ? "secondary" : "ghost"}
              className={cn(difficulty === d && "bg-fiesta-crimson/25 text-fiesta-gold")}
              onClick={() => setDifficulty(d)}
            >
              {DIFFICULTY_LABELS[d].title}
            </Button>
          ))}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={scope === "global" ? "default" : "outline"}
          className="gap-1.5"
          onClick={() => setScope("global")}
        >
          <Globe className="size-3.5" />
          Global
        </Button>
        <Button
          type="button"
          size="sm"
          variant={scope === "friends" ? "default" : "outline"}
          className="gap-1.5"
          onClick={() => setScope("friends")}
        >
          <Users className="size-3.5" />
          Amigos
        </Button>
        <Button
          type="button"
          size="sm"
          variant={window === "all" ? "secondary" : "outline"}
          className="gap-1.5 border-fiesta-gold/20"
          onClick={() => setWindow("all")}
        >
          Siempre
        </Button>
        <Button
          type="button"
          size="sm"
          variant={window === "week" ? "secondary" : "outline"}
          className="gap-1.5 border-fiesta-orange/25"
          onClick={() => setWindow("week")}
        >
          <CalendarRange className="size-3.5" />
          Esta semana
        </Button>
      </div>

      {scope === "friends" && (
        <p className="mb-4 text-xs text-muted-foreground">
          Amigos = gente que seguís. Seguí desde cada fila (vista global) o invitá a tu crew.
        </p>
      )}

      <Card className="border-fiesta-gold/20 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {window === "week" && (
              <motion.span
                animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="inline-flex text-fiesta-orange"
              >
                <Flame className="size-5" />
              </motion.span>
            )}
            Ranking
          </CardTitle>
          <CardDescription>
            {data?.myRank != null ? (
              <>
                Tu posición: <span className="font-semibold text-fiesta-gold">#{data.myRank}</span>
                {window === "week" && data.weekStartsAt && (
                  <span className="block text-xs">
                    Semana UTC desde {new Date(data.weekStartsAt).toLocaleDateString()}
                  </span>
                )}
              </>
            ) : (
              "Entrá al ranking jugando — o sumá partidas esta semana."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Cargando…
            </div>
          )}
          {err && !loading && (
            <p className="py-8 text-center text-sm text-fiesta-orange" role="alert">
              {err}
            </p>
          )}
          {!loading && !err && data && data.entries.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {scope === "friends"
                ? "Todavía no seguís a nadie o no hay datos en este filtro."
                : "Sin datos todavía — ¡ser el primero!"}
            </p>
          )}
          {!loading && !err && data && data.entries.length > 0 && (
            <ul className="space-y-2">
              {data.entries.map((e) => {
                const isSelf = e.userId === data.selfId;
                const isHot = e.rank <= 3;
                return (
                  <motion.li
                    key={e.userId}
                    layout
                    initial={reduce ? false : { opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                      isSelf ? "border-fiesta-gold/50 bg-fiesta-crimson/15" : "border-border/60 bg-background/40",
                      isHot && !isSelf && "border-fiesta-orange/30",
                    )}
                  >
                    <LeaderboardMedal rank={e.rank} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {e.username ?? "Explorador"}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-fiesta-gold">(vos)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatValue(board, e)}</p>
                    </div>
                    {isHot && (
                      <motion.span
                        className="shrink-0 text-fiesta-orange"
                        animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        aria-hidden
                      >
                        <Flame className="size-5" />
                      </motion.span>
                    )}
                    {scope === "global" && !isSelf && (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="shrink-0 border-fiesta-gold/25"
                        disabled={pendingFollow === e.userId}
                        onClick={() => void toggleFollow(e.userId, followingSet.has(e.userId))}
                      >
                        {pendingFollow === e.userId
                          ? "…"
                          : followingSet.has(e.userId)
                            ? "Dejar"
                            : "Seguir"}
                      </Button>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground sm:text-left">
        <Link href="/profile" className="text-fiesta-gold underline-offset-4 hover:underline">
          Perfil
        </Link>
        {" · "}
        <Link href="/" className="underline-offset-4 hover:underline">
          Inicio
        </Link>
      </p>
    </div>
  );
}
