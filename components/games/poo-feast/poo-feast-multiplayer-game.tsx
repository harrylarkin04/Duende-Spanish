"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Copy,
  Flame,
  Home,
  Loader2,
  Users,
  Wifi,
  WifiOff,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import {
  MultiplayerConnectingSpinner,
  MultiplayerErrorPanel,
} from "@/components/games/palabra-vortex/multiplayer-page-ui";
import { VictoryConfetti } from "@/components/games/palabra-vortex/victory-confetti";
import { PooFeastGrossStage } from "@/components/games/poo-feast/poo-feast-gross-stage";
import {
  PooFeastAromaCompare,
  PooFeastFoodGrid,
  PooFeastScoreBreakdown,
} from "@/components/games/poo-feast/poo-feast-shared";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { POO_FEAST_DIGEST_MS, POO_FEAST_PICK_COUNT } from "@/lib/games/poo-feast/constants";
import type { PooFeastLocale } from "@/lib/games/poo-feast/messages";
import { pooFeastMessages } from "@/lib/games/poo-feast/messages";
import { flagEmoji, guessBrowserCountry, normalizePooRoomCode } from "@/lib/games/poo-feast/multiplayer-utils";
import { computeSmellScore, type SmellResult } from "@/lib/games/poo-feast/scoring";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";

type RoomRow = Database["public"]["Tables"]["poo_feast_rooms"]["Row"];
type MemberRow = Database["public"]["Tables"]["poo_feast_members"]["Row"];
type PickRow = Database["public"]["Tables"]["poo_feast_picks"]["Row"];
type ProfileMini = { user_id: string; username: string | null; avatar_url: string | null };

type Screen = "entry" | "lobby" | "picking" | "digest";

/** PostgREST / Supabase errors are often `{ message }` objects, not `Error` instances. */
function supabaseThrownMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null) {
    const o = e as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.length > 0) return o.message;
    if (typeof o.error_description === "string" && o.error_description.length > 0)
      return o.error_description;
    if (typeof o.hint === "string" && o.hint.length > 0 && typeof o.message === "string")
      return `${o.message} (${o.hint})`;
  }
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Request failed";
  }
}

export function PooFeastMultiplayerGame(): React.ReactElement {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;
  const supabase = React.useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const roomFromUrl = React.useMemo(
    () => normalizePooRoomCode(searchParams.get("room")),
    [searchParams],
  );

  const [locale, setLocale] = React.useState<PooFeastLocale>("es");
  const m = pooFeastMessages[locale];

  const [boot, setBoot] = React.useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [bootErr, setBootErr] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  const [screen, setScreen] = React.useState<Screen>("entry");
  const [conn, setConn] = React.useState<"idle" | "ok" | "error">("idle");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [roomCode, setRoomCode] = React.useState("");
  const [joinInput, setJoinInput] = React.useState("");
  const [room, setRoom] = React.useState<RoomRow | null>(null);
  const [members, setMembers] = React.useState<MemberRow[]>([]);
  const [picks, setPicks] = React.useState<PickRow[]>([]);
  const [profiles, setProfiles] = React.useState<Map<string, ProfileMini>>(new Map());

  const [countryCode, setCountryCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const [selection, setSelection] = React.useState<string[]>([]);
  const [digestLine, setDigestLine] = React.useState(0);
  const [revealLocal, setRevealLocal] = React.useState(false);
  const [scores, setScores] = React.useState<{ a: SmellResult; b: SmellResult } | null>(null);

  const joinedFromUrlRef = React.useRef(false);

  React.useEffect(() => {
    if (!countryCode) setCountryCode(guessBrowserCountry());
  }, [countryCode]);

  React.useEffect(() => {
    if (!supabase) {
      setBootErr("Supabase client unavailable");
      setBoot("failed");
      return;
    }
    void supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        setBootErr(error?.message ?? "Not signed in");
        setBoot("failed");
        return;
      }
      setUserId(data.user.id);
      setBoot("ready");
    });
  }, [supabase]);

  const refreshState = React.useCallback(
    async (code: string): Promise<boolean> => {
      if (!supabase) return false;
      const hint =
        " If tables are missing, apply supabase/migrations/009_poo_feast_multiplayer.sql in the Supabase SQL editor.";
      const [rRes, mRes, pRes] = await Promise.all([
        supabase.from("poo_feast_rooms").select("*").eq("room_code", code).maybeSingle(),
        supabase.from("poo_feast_members").select("*").eq("room_code", code),
        supabase.from("poo_feast_picks").select("*").eq("room_code", code),
      ]);

      if (rRes.error) {
        const msg =
          rRes.error.code === "42P01" || /does not exist/i.test(rRes.error.message)
            ? `Poo feast multiplayer tables are missing.${hint}`
            : rRes.error.message;
        setErr(msg);
        setRoom(null);
        return false;
      }
      if (mRes.error) {
        setErr(mRes.error.message + hint);
        setRoom(null);
        return false;
      }
      if (pRes.error) {
        setErr(pRes.error.message + hint);
        return false;
      }
      if (!rRes.data) {
        setErr(`Room “${code}” not found or expired.${hint}`);
        setRoom(null);
        return false;
      }

      setRoom(rRes.data as RoomRow);
      const mems = (mRes.data ?? []) as MemberRow[];
      setMembers(mems);
      setPicks((pRes.data ?? []) as PickRow[]);

      const ids = mems.map((x) => x.user_id);
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", ids);
        setProfiles(new Map((profs ?? []).map((p) => [p.user_id, p as ProfileMini])));
      } else setProfiles(new Map());

      return true;
    },
    [supabase],
  );

  React.useEffect(() => {
    if (!roomCode || !supabase || boot !== "ready") return;

    const ch = supabase
      .channel(`poo-feast-room:${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poo_feast_rooms", filter: `room_code=eq.${roomCode}` },
        () => void refreshState(roomCode),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poo_feast_members", filter: `room_code=eq.${roomCode}` },
        () => void refreshState(roomCode),
      )
      .subscribe((status) => {
        setConn(status === "SUBSCRIBED" ? "ok" : "error");
      });

    return () => void supabase.removeChannel(ch);
  }, [roomCode, supabase, boot, refreshState]);

  React.useEffect(() => {
    if (boot !== "ready" || !userId || !supabase || roomFromUrl.length !== 6 || joinedFromUrlRef.current)
      return;
    joinedFromUrlRef.current = true;
    void (async () => {
      setBusy(true);
      setErr(null);
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", userId)
          .maybeSingle();
        const { error } = await supabase.rpc("join_poo_feast_room", {
          p_room_code: roomFromUrl,
          p_country_code: countryCode || guessBrowserCountry(),
          p_username_snapshot: prof?.username ?? null,
        });
        if (error) throw error;
        setRoomCode(roomFromUrl);
        const ok = await refreshState(roomFromUrl);
        if (!ok) {
          joinedFromUrlRef.current = false;
          setScreen("entry");
          return;
        }
        setScreen("lobby");
      } catch (e) {
        joinedFromUrlRef.current = false;
        console.error("[poo-feast-mp] join from URL:", e);
        setErr(supabaseThrownMessage(e));
      } finally {
        setBusy(false);
      }
    })();
  }, [boot, userId, supabase, roomFromUrl, countryCode, refreshState]);

  const isHost = room != null && userId != null && room.host_id === userId;

  React.useEffect(() => {
    if (!room) return;
    if (room.status === "lobby") {
      setScreen("lobby");
      setSelection([]);
      setRevealLocal(false);
      setScores(null);
      return;
    }
    if (room.status === "picking") {
      setScreen("picking");
      const mine = picks.find((p) => p.user_id === userId);
      if (mine?.picks) setSelection([...mine.picks]);
      else setSelection([]);
      setRevealLocal(false);
      setScores(null);
      return;
    }
    if (room.status === "digest") {
      setScreen("digest");
      setDigestLine(0);
      return;
    }
  }, [room, picks, userId]);

  React.useEffect(() => {
    if (screen !== "digest" || !room?.digest_started_at) return;
    const t0 = Date.parse(room.digest_started_at);
    const end = t0 + POO_FEAST_DIGEST_MS;
    const tick = () => {
      if (Date.now() >= end) setRevealLocal(true);
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [screen, room?.digest_started_at]);

  React.useEffect(() => {
    if (screen !== "digest") return;
    const id = window.setInterval(() => {
      setDigestLine((i) => (i + 1) % m.digestHints.length);
    }, 900);
    return () => window.clearInterval(id);
  }, [screen, m.digestHints.length]);

  React.useEffect(() => {
    if (!revealLocal || picks.length < 2) return;
    const sorted = [...picks].sort((a, b) => a.user_id.localeCompare(b.user_id));
    setScores({
      a: computeSmellScore(sorted[0]!.picks),
      b: computeSmellScore(sorted[1]!.picks),
    });
  }, [revealLocal, picks]);

  const createRoom = async () => {
    if (!supabase) {
      setErr(
        "Supabase no está configurado en esta compilación (faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      );
      return;
    }
    if (!userId) return;
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc("create_poo_feast_room", {});
      if (error) throw error;
      const row = data?.[0];
      if (!row?.out_room_code) throw new Error("No room code returned");
      setRoomCode(row.out_room_code);
      const ok = await refreshState(row.out_room_code);
      if (!ok) {
        setScreen("entry");
        return;
      }
      setScreen("lobby");
    } catch (e) {
      console.error("[poo-feast-mp] createRoom:", e);
      const msg = supabaseThrownMessage(e);
      setErr(
        msg.includes("generate_palabra") || msg.includes("does not exist") || msg.includes("42883")
          ? `${msg} — En Supabase, ejecuta las migraciones 009 y 010 de supabase/migrations (Festín olfativo).`
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  const joinManual = async () => {
    const code = normalizePooRoomCode(joinInput);
    if (!supabase || !userId || code.length !== 6) {
      setErr("Enter a 6-character room code.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();
      const { error } = await supabase.rpc("join_poo_feast_room", {
        p_room_code: code,
        p_country_code: countryCode || guessBrowserCountry(),
        p_username_snapshot: prof?.username ?? null,
      });
      if (error) throw error;
      setRoomCode(code);
      const ok = await refreshState(code);
      if (!ok) {
        setScreen("entry");
        return;
      }
      setScreen("lobby");
    } catch (e) {
      console.error("[poo-feast-mp] joinManual:", e);
      setErr(supabaseThrownMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleReady = async () => {
    if (!supabase || !userId || !roomCode) return;
    const me = members.find((x) => x.user_id === userId);
    const next = !(me?.ready ?? false);
    await supabase.from("poo_feast_members").update({ ready: next }).eq("room_code", roomCode).eq("user_id", userId);
    await refreshState(roomCode);
  };

  const startPicking = async () => {
    if (!supabase || !isHost || !roomCode) return;
    const readyN = members.filter((x) => x.ready).length;
    if (members.length !== 2 || readyN !== 2) {
      setErr(m.mpNeedTwoReady);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc("begin_poo_feast_picking", { p_room_code: roomCode });
      if (error) throw error;
      await refreshState(roomCode);
    } catch (e) {
      console.error("[poo-feast-mp] startPicking:", e);
      setErr(supabaseThrownMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleFood = React.useCallback((id: string) => {
    setSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= POO_FEAST_PICK_COUNT) return prev;
      return [...prev, id];
    });
  }, []);

  const lockMenu = async () => {
    if (!supabase || !roomCode || selection.length !== POO_FEAST_PICK_COUNT) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.rpc("submit_poo_feast_picks", {
        p_room_code: roomCode,
        p_picks: selection,
      });
      if (error) throw error;
      await refreshState(roomCode);
    } catch (e) {
      console.error("[poo-feast-mp] lockMenu:", e);
      setErr(supabaseThrownMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const rematch = async () => {
    if (!supabase || !isHost || !roomCode) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("rematch_poo_feast_room", { p_room_code: roomCode });
      if (error) throw error;
      await refreshState(roomCode);
      setRevealLocal(false);
      setScores(null);
    } catch (e) {
      console.error("[poo-feast-mp] rematch:", e);
      setErr(supabaseThrownMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/games/poo-feast/multiplayer?room=${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("Could not copy link.");
    }
  };

  const displayName = React.useCallback(
    (uid: string) => {
      const mem = members.find((x) => x.user_id === uid);
      return profiles.get(uid)?.username ?? mem?.username_snapshot ?? m.mpOpponent;
    },
    [members, profiles, m.mpOpponent],
  );

  const orderingIds = React.useMemo(() => {
    const ids = members.map((x) => x.user_id).sort((a, b) => a.localeCompare(b));
    return ids;
  }, [members]);

  const outcome = React.useMemo(() => {
    if (!scores || orderingIds.length < 2) return null;
    if (scores.a.total === scores.b.total) return "tie" as const;
    return scores.a.total > scores.b.total ? orderingIds[0]! : orderingIds[1]!;
  }, [scores, orderingIds]);

  const maxAroma =
    scores != null ? Math.max(scores.a.total, scores.b.total, 1) : 1;

  if (boot === "idle" || boot === "loading") {
    return <MultiplayerConnectingSpinner context="poo-feast-auth" />;
  }

  if (boot === "failed" || !userId) {
    return (
      <MultiplayerErrorPanel
        title={m.mpSignInTitle}
        message={m.mpSignInBody}
        technical={bootErr}
      />
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <VictoryConfetti active={screen === "digest" && revealLocal && outcome !== null && outcome !== "tie"} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
            <Flame className="size-3.5" aria-hidden />
            {m.mpBadge}
          </span>
          {conn === "ok" ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Wifi className="size-3.5 text-emerald-400" aria-hidden />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <WifiOff className="size-3.5 text-fiesta-orange" aria-hidden />
              …
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/games/poo-feast/local"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "inline-flex gap-1.5")}
          >
            <Home className="size-3.5" />
            {m.localMode}
          </Link>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/40 p-0.5 text-xs">
            <button
              type="button"
              className={cn(
                "rounded-full px-2 py-1",
                locale === "es" ? "bg-fiesta-crimson/30 text-fiesta-gold" : "text-muted-foreground",
              )}
              onClick={() => setLocale("es")}
            >
              ES
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-2 py-1",
                locale === "en" ? "bg-fiesta-crimson/30 text-fiesta-gold" : "text-muted-foreground",
              )}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center sm:text-left"
      >
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            {m.title}
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{m.mpSubtitle}</p>
      </motion.div>

      {err != null && (
        <div className="mb-4 rounded-xl border border-fiesta-orange/40 bg-fiesta-orange/10 px-4 py-3 text-sm text-foreground">
          {err}
        </div>
      )}

      <AnimatePresence mode="wait">
        {screen === "entry" && (
          <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-fiesta-gold/20 bg-card/60">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)]">{m.mpCreateRoom}</CardTitle>
                <CardDescription>{m.mpSubtitle}</CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={busy}
                  className="bg-fiesta-crimson text-white hover:bg-fiesta-crimson/90"
                  onClick={() => void createRoom()}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {m.mpCreateRoom}
                </Button>
              </CardFooter>
              <CardContent className="space-y-3 border-t border-border/40 pt-4">
                <label className="text-sm font-medium">{m.mpJoinRoom}</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    maxLength={8}
                    placeholder={m.mpRoomPlaceholder}
                    className="min-w-[10rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tracking-widest"
                  />
                  <Button type="button" variant="secondary" disabled={busy} onClick={() => void joinManual()}>
                    {m.mpJoinRoom}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {screen === "lobby" && room != null && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-fiesta-gold/25 bg-card/70">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)]">
                  <Users className="size-5 text-fiesta-gold" aria-hidden />
                  {m.mpPlayersInRoom(members.length)}
                </CardTitle>
                <CardDescription className="font-mono text-lg tracking-[0.35em] text-fiesta-gold">
                  {roomCode}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
                    <Copy className="size-3.5" />
                    {copied ? m.mpCopied : m.mpCopyLink}
                  </Button>
                  {isHost && (
                    <Button type="button" size="sm" className="bg-fiesta-crimson text-white" onClick={() => void startPicking()}>
                      {m.mpStartFeast}
                    </Button>
                  )}
                </div>
                <ul className="space-y-2">
                  {members.map((mem) => (
                    <li
                      key={mem.user_id}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{flagEmoji(mem.country_code)}</span>
                        <span className="font-medium">{displayName(mem.user_id)}</span>
                        {mem.user_id === room.host_id && (
                          <span className="rounded-full bg-fiesta-gold/15 px-2 py-0.5 text-[10px] text-fiesta-gold">
                            {m.mpYouAreHost}
                          </span>
                        )}
                      </span>
                      <span className={cn("text-xs", mem.ready ? "text-emerald-400" : "text-muted-foreground")}>
                        {mem.ready ? m.mpReady : m.mpNotReady}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button type="button" variant="secondary" onClick={() => void toggleReady()} disabled={busy}>
                  {members.find((x) => x.user_id === userId)?.ready ? m.mpNotReady : m.mpReady}
                </Button>
                {!isHost && <p className="text-xs text-muted-foreground">{m.mpWaitingHost}</p>}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {screen === "picking" && room != null && (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-fiesta-gold/15 bg-card/60 ring-2 ring-fiesta-crimson/35">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)]">
                  {m.pickPrompt(m.mpYou, POO_FEAST_PICK_COUNT)}
                </CardTitle>
                <CardDescription>{m.picksLabel(selection.length, POO_FEAST_PICK_COUNT)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PooFeastFoodGrid
                  reduce={reduce}
                  locale={locale}
                  categoryLabels={m.categoryLabels}
                  selection={selection}
                  onToggle={toggleFood}
                  disabled={picks.some((p) => p.user_id === userId)}
                  pickCount={POO_FEAST_PICK_COUNT}
                />
                {picks.some((p) => p.user_id === userId) ? (
                  <p className="text-sm text-muted-foreground">{m.mpWaitingOpponentMenu}</p>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    disabled={busy || selection.length !== POO_FEAST_PICK_COUNT}
                    className="bg-fiesta-crimson text-white"
                    onClick={() => void lockMenu()}
                  >
                    {m.mpLockMenu}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {screen === "digest" && room?.digest_started_at != null && (
          <motion.div key="digest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <PooFeastGrossStage
              stenchLevel={0.95}
              caption={m.mpDigestBattle}
              tapHint={m.grossTapHint}
            />
            <Card className="border-fiesta-orange/30 bg-linear-to-br from-fiesta-crimson/25 via-card/85 to-[#1a1510]/90">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">{m.digestTitle}</CardTitle>
                <CardDescription className="min-h-[3rem] text-base text-foreground/90">
                  {m.digestHints[digestLine]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full overflow-hidden rounded-full bg-background/60">
                  <motion.div
                    key={room.digest_started_at ?? "d"}
                    className="h-full rounded-full bg-linear-to-r from-lime-700 via-fiesta-orange to-fiesta-crimson"
                    initial={{ width: "2%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: POO_FEAST_DIGEST_MS / 1000,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {revealLocal && scores != null && orderingIds.length >= 2 && (
              <Card className="border-fiesta-gold/35 bg-card/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)]">
                    <Wind className="size-5 text-fiesta-orange" />
                    {m.mpRevealNow}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <PooFeastAromaCompare
                    reduce={reduce}
                    name1={displayName(orderingIds[0]!)}
                    name2={displayName(orderingIds[1]!)}
                    r1={scores.a}
                    r2={scores.b}
                    max={maxAroma}
                    baseLine={m.baseLine}
                    bonusWord={m.bonusWord}
                  />
                  <div className="rounded-xl border border-fiesta-gold/25 bg-fiesta-gold/5 p-4 text-center">
                    <p className="font-[family-name:var(--font-heading)] text-xl font-bold">
                      {outcome === "tie" ? m.tie : outcome != null ? m.winner(displayName(outcome)) : ""}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PooFeastScoreBreakdown
                      locale={locale}
                      title={displayName(orderingIds[0]!)}
                      result={scores.a}
                      highlight={outcome === orderingIds[0]}
                      baseLineLabel={m.baseLine}
                    />
                    <PooFeastScoreBreakdown
                      locale={locale}
                      title={displayName(orderingIds[1]!)}
                      result={scores.b}
                      highlight={outcome === orderingIds[1]}
                      baseLineLabel={m.baseLine}
                    />
                  </div>
                  {isHost ? (
                    <Button type="button" className="bg-fiesta-crimson text-white" disabled={busy} onClick={() => void rematch()}>
                      {m.mpRematch}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">{m.mpWaitingHost}</p>
                  )}
                  <Link href="/games/poo-feast" className={cn(buttonVariants({ variant: "outline", size: "default" }))}>
                    {m.mpLeave}
                  </Link>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
