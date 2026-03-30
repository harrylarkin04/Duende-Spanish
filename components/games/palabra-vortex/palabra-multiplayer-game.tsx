"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Gamepad2,
  Heart,
  Sparkles,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import type { PalabraVocabResult } from "@/app/(protected)/actions/record-game";
import { recordPalabraRun } from "@/app/(protected)/actions/record-game";
import { FieryBurst } from "@/components/games/palabra-vortex/fiery-burst";
import {
  MultiplayerConnectingSpinner,
  MultiplayerErrorPanel,
} from "@/components/games/palabra-vortex/multiplayer-page-ui";
import { VictoryConfetti } from "@/components/games/palabra-vortex/victory-confetti";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { checkTranslation } from "@/lib/games/palabra-vortex/game-utils";
import type { PalabraDifficultyLevel, PalabraEntry, PalabraItemType } from "@/lib/games/palabra-vortex/types";
import {
  countryLabel,
  flagEmoji,
  MP_BASE_SCORE,
  MP_BROADCAST_EVENT,
  MP_DEFAULT_ROUNDS,
  MP_ROUND_MS,
  MP_STRIKE_BONUS,
  MP_TARGET_SCORE,
  buildMpDeck,
  guessBrowserCountry,
  isMPPayload,
  mpChannelName,
  type MPBPayload,
} from "@/lib/games/palabra-vortex/multiplayer-utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import type { RealtimeChannel } from "@supabase/supabase-js";

type RoomRow = Database["public"]["Tables"]["palabra_multiplayer_rooms"]["Row"];
type MemberRow = Database["public"]["Tables"]["palabra_multiplayer_members"]["Row"];
type ProfileMini = { user_id: string; username: string | null; avatar_url: string | null };

type Screen = "entry" | "lobby" | "playing" | "summary";

const PRESET_REACTIONS = ["¡Vamos!", "Too slow 😜", "Good one ❤️", "¡Olé!", "🔥"];

const TYPE_STYLES: Record<
  PalabraItemType,
  { label: string; className: string }
> = {
  word: { label: "Word", className: "border-sky-400/45 bg-sky-500/10 text-sky-100" },
  phrase: { label: "Phrase", className: "border-violet-400/45 bg-violet-500/12 text-violet-100" },
  collocation: { label: "Collocation", className: "border-emerald-400/45 bg-emerald-500/12 text-emerald-100" },
  idiom: { label: "Idiom", className: "border-amber-400/50 bg-amber-500/12 text-amber-100" },
};

function normalizeRoomCode(raw: string | null): string {
  if (!raw) return "";
  return raw.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

function ItemBadge({ type }: { type?: PalabraItemType }) {
  if (!type) return null;
  const s = TYPE_STYLES[type];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}

export function PalabraMultiplayerGame() {
  const reduceMotion = useReducedMotion();
  const supabase = React.useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const roomFromUrl = React.useMemo(
    () => normalizeRoomCode(searchParams.get("room")),
    [searchParams],
  );

  const [userId, setUserId] = React.useState<string | null>(null);
  const [screen, setScreen] = React.useState<Screen>("entry");
  const [conn, setConn] = React.useState<"idle" | "connecting" | "ok" | "reconnecting" | "error">(
    "idle",
  );
  const [roomCode, setRoomCode] = React.useState<string>("");
  const [room, setRoom] = React.useState<RoomRow | null>(null);
  const [members, setMembers] = React.useState<MemberRow[]>([]);
  const [profiles, setProfiles] = React.useState<Map<string, ProfileMini>>(new Map());
  const [joinInput, setJoinInput] = React.useState("");
  const [countryCode, setCountryCode] = React.useState("");
  const [difficultyPick, setDifficultyPick] = React.useState<PalabraDifficultyLevel>("medium");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [deck, setDeck] = React.useState<PalabraEntry[]>([]);
  const [roundIndex, setRoundIndex] = React.useState(0);
  const [roundEndsAt, setRoundEndsAt] = React.useState<number | null>(null);
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [input, setInput] = React.useState("");
  const [roundMsg, setRoundMsg] = React.useState<string | null>(null);
  const [partnerToast, setPartnerToast] = React.useState<string | null>(null);
  const [strikeBurst, setStrikeBurst] = React.useState(0);
  const [summaryBurst, setSummaryBurst] = React.useState(false);
  const [submittedRound, setSubmittedRound] = React.useState<number | null>(null);

  const [myRoundsWon, setMyRoundsWon] = React.useState(0);
  const [fastestMs, setFastestMs] = React.useState<number | null>(null);
  const [idiomHits, setIdiomHits] = React.useState(0);
  const [vocabResults, setVocabResults] = React.useState<PalabraVocabResult[]>([]);
  const [savedRun, setSavedRun] = React.useState(false);

  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const finalizeRoundHostRef = React.useRef<(firstUid: string | null, round: number) => Promise<void>>(
    async () => {},
  );
  const roundResolvedRef = React.useRef<Set<number>>(new Set());
  const roundStartMsRef = React.useRef<number>(0);
  const isHostRef = React.useRef(false);
  const userIdRef = React.useRef<string | null>(null);
  const roomCodeRef = React.useRef("");
  const totalRoundsRef = React.useRef(MP_DEFAULT_ROUNDS);
  const targetScoreRef = React.useRef(MP_TARGET_SCORE);
  const deckRef = React.useRef<PalabraEntry[]>([]);
  const profilesRef = React.useRef<Map<string, ProfileMini>>(new Map());
  const scoresRef = React.useRef<Record<string, number>>({});
  const membersRef = React.useRef<MemberRow[]>([]);
  const joinedFromUrlRef = React.useRef(false);

  const [boot, setBoot] = React.useState<"checking" | "ready" | "failed">("checking");
  const [bootFailTitle, setBootFailTitle] = React.useState("Can’t start multiplayer");
  const [bootFailMessage, setBootFailMessage] = React.useState("");
  const [bootFailTechnical, setBootFailTechnical] = React.useState<string | null>(null);

  React.useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  React.useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);
  React.useEffect(() => {
    deckRef.current = deck;
  }, [deck]);
  React.useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);
  React.useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);
  React.useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const isHost = Boolean(userId && room && room.host_id === userId);
  React.useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  React.useEffect(() => {
    console.log("[duende-mp] boot: checking Supabase + auth", { roomFromUrl });
    setBoot("checking");
    setBootFailTechnical(null);

    if (!supabase) {
      const tech =
        "createClient() returned null. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (dev) or Vercel → Project → Settings → Environment Variables (production).";
      console.error("[duende-mp] boot failed:", tech);
      setBootFailTitle("Supabase is not configured");
      setBootFailMessage(
        "The app cannot reach your database. Add your Supabase URL and anon key, then reload this page.",
      );
      setBootFailTechnical(tech);
      setBoot("failed");
      return;
    }

    void supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        const tech = `${error.name}: ${error.message}`;
        console.error("[duende-mp] auth.getUser error:", error);
        setBootFailTitle("Auth check failed");
        setBootFailMessage("Supabase could not verify your session. Try signing out and back in.");
        setBootFailTechnical(
          `${tech}${error.cause != null ? `\nCause: ${String(error.cause)}` : ""}\nStack: ${error.stack ?? "(none)"}`,
        );
        setBoot("failed");
        return;
      }
      if (!data.user) {
        const tech = "getUser() returned no user. Middleware should redirect anonymous users to /login.";
        console.error("[duende-mp] boot failed:", tech);
        setBootFailTitle("Not signed in");
        setBootFailMessage("You need an account to play multiplayer. Open the login page and try again.");
        setBootFailTechnical(tech);
        setBoot("failed");
        return;
      }

      console.log("[duende-mp] boot: ready", { userId: data.user.id, roomFromUrl });
      setUserId(data.user.id);
      setBoot("ready");
    });
  }, [supabase, roomFromUrl]);

  React.useEffect(() => {
    if (!countryCode) setCountryCode(guessBrowserCountry());
  }, [countryCode]);

  const refreshState = React.useCallback(
    async (code: string, mode: "strict" | "soft" = "strict") => {
      if (!supabase) return false;
      const [rRes, mRes] = await Promise.all([
        supabase.from("palabra_multiplayer_rooms").select("*").eq("room_code", code).maybeSingle(),
        supabase.from("palabra_multiplayer_members").select("*").eq("room_code", code),
      ]);

      const hintMigrations =
        " If this is your project, run the SQL in supabase/migrations/006_palabra_multiplayer.sql (and earlier migrations) in the Supabase SQL editor.";

      if (rRes.error) {
        if (mode === "strict") {
          const msg =
            rRes.error.code === "42P01" || /relation.*does not exist/i.test(rRes.error.message)
              ? `Multiplayer database tables are missing.${hintMigrations}`
              : rRes.error.message;
          console.error("[duende-mp] refreshState rooms error:", rRes.error.code, rRes.error.message, {
            code,
            mode,
          });
          setErr(msg);
          setRoom(null);
        }
        return false;
      }
      if (mRes.error) {
        if (mode === "strict") {
          const msg =
            mRes.error.code === "42P01" || /relation.*does not exist/i.test(mRes.error.message)
              ? `Multiplayer database tables are missing.${hintMigrations}`
              : mRes.error.message;
          console.error("[duende-mp] refreshState members error:", mRes.error.code, mRes.error.message, {
            code,
            mode,
          });
          setErr(msg);
          setRoom(null);
        }
        return false;
      }

      if (!rRes.data) {
        if (mode === "strict") {
          const msg = `Could not load room “${code}”. It may not exist, expired, or your account can’t read it (check database migrations and RLS).${hintMigrations}`;
          console.error("[duende-mp] refreshState: no room row", { code });
          setErr(msg);
          setRoom(null);
        }
        return false;
      }

      setRoom(rRes.data as RoomRow);
      const mems = (mRes.data ?? []) as MemberRow[];
      setMembers(mems);
      const ids = mems.map((m) => m.user_id);
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

  const bumpStrikeStats = React.useCallback((roundIdx: number) => {
    setMyRoundsWon((x) => x + 1);
    setStrikeBurst((k) => k + 1);
    const entry = deckRef.current[roundIdx];
    if (entry) {
      setVocabResults((v) => [...v, { spanish: entry.es, english: entry.en, correct: true }]);
      if (entry.itemType === "idiom") setIdiomHits((x) => x + 1);
      const reactMs = Date.now() - roundStartMsRef.current;
      setFastestMs((prev) => (prev == null ? reactMs : Math.min(prev, reactMs)));
    }
  }, []);

  const sendPayload = React.useCallback((payload: MPBPayload) => {
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({ type: "broadcast", event: MP_BROADCAST_EVENT, payload });
  }, []);

  const teardownChannel = React.useCallback(async () => {
    const ch = channelRef.current;
    channelRef.current = null;
    if (ch) await ch.unsubscribe();
  }, []);

  const attachChannel = React.useCallback(
    async (code: string) => {
      if (!supabase || !userId) return;
      setConn("connecting");
      await teardownChannel();
      const topic = mpChannelName(code);
      console.log("[duende-mp] attachChannel subscribe", { roomCode: code, topic });
      const channel = supabase
        .channel(topic, { config: { broadcast: { self: true } } })
        .on("broadcast", { event: MP_BROADCAST_EVENT }, ({ payload }) => {
          if (!isMPPayload(payload)) return;
          const p = payload;

          if (p.t === "claim") {
            if (!isHostRef.current) return;
            if (roundResolvedRef.current.has(p.roundIndex)) return;
            void finalizeRoundHostRef.current(p.userId, p.roundIndex);
            return;
          }

          if (p.t === "game_start") {
            roundResolvedRef.current = new Set();
            totalRoundsRef.current = p.totalRounds;
            targetScoreRef.current = p.targetScore;
            const d = buildMpDeck(p.seed, p.difficulty, p.totalRounds);
            setDeck(d);
            setRoundIndex(p.roundIndex);
            setRoundEndsAt(p.roundEndsAt);
            roundStartMsRef.current = Date.now();
            setScreen("playing");
            setInput("");
            setSubmittedRound(null);
            setRoundMsg(null);
            return;
          }

          if (p.t === "round_start") {
            setRoundIndex(p.roundIndex);
            setRoundEndsAt(p.roundEndsAt);
            roundStartMsRef.current = Date.now();
            setInput("");
            setSubmittedRound(null);
            setRoundMsg(null);
            return;
          }

          if (p.t === "resolve") {
            if (roundResolvedRef.current.has(p.roundIndex)) return;
            roundResolvedRef.current.add(p.roundIndex);
            setScores({ ...p.scores });
            const mine = userIdRef.current;
            if (p.strikeUserId && p.strikeUserId === mine) {
              bumpStrikeStats(p.roundIndex);
            }
            if (p.firstUserId && p.firstUserId !== mine) {
              const name = profilesRef.current.get(p.firstUserId)?.username ?? "Partner";
              setPartnerToast(`${name} got it first! 🔥`);
              window.setTimeout(() => setPartnerToast(null), 3200);
            }
            const r = `Round ${p.roundIndex + 1} — ${p.strikeUserId ? "Duende Strike!" : "Time's up or draw"}`;
            setRoundMsg(r);
            window.setTimeout(() => setRoundMsg(null), 2800);
            return;
          }

          if (p.t === "reaction") {
            if (p.userId === userIdRef.current) return;
            const who = profilesRef.current.get(p.userId)?.username ?? "Partner";
            setPartnerToast(`${who}: ${p.preset}`);
            window.setTimeout(() => setPartnerToast(null), 2800);
            return;
          }

          if (p.t === "rematch") {
            roundResolvedRef.current = new Set();
            setDeck([]);
            setScores({});
            setScreen("lobby");
            setSummaryBurst(false);
            setSavedRun(false);
            setMyRoundsWon(0);
            setFastestMs(null);
            setIdiomHits(0);
            setVocabResults([]);
            void refreshState(roomCodeRef.current, "soft");
            return;
          }
        })
        .on("presence", { event: "sync" }, () => {
          setConn("ok");
        })
        .on("presence", { event: "join" }, () => setConn("ok"))
        .on("presence", { event: "leave" }, () => setConn("ok"));

      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "palabra_multiplayer_members", filter: `room_code=eq.${code}` },
        () => {
          void refreshState(code, "soft");
        },
      );

      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "palabra_multiplayer_rooms", filter: `room_code=eq.${code}` },
        ({ new: row }) => {
          const r = row as RoomRow;
          setRoom(r);
          if (r.status === "playing" && r.game_seed) {
            const diff = r.difficulty as PalabraDifficultyLevel;
            const tr = r.total_rounds ?? MP_DEFAULT_ROUNDS;
            totalRoundsRef.current = tr;
            targetScoreRef.current = r.target_score ?? MP_TARGET_SCORE;
            const built = buildMpDeck(r.game_seed, diff, tr);
            setDeck(built);
            setRoundIndex(r.round_index ?? 0);
            if (r.round_ends_at) setRoundEndsAt(new Date(r.round_ends_at).getTime());
            setScreen("playing");
          }
          if (r.status === "lobby") {
            setScreen("lobby");
          }
        },
      );

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConn("ok");
          const label = countryLabel(countryCode || guessBrowserCountry());
          await channel.track({
            user_id: userId,
            username: profilesRef.current.get(userId)?.username ?? "Player",
            country: countryCode || guessBrowserCountry(),
            label,
            online_at: Date.now(),
          });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[duende-mp] Realtime channel status:", status, { topic });
          setConn("reconnecting");
        }
      });

      channelRef.current = channel;
    },
    [supabase, userId, teardownChannel, refreshState, countryCode, bumpStrikeStats],
  );

  React.useEffect(() => {
    return () => {
      void teardownChannel();
    };
  }, [teardownChannel]);

  React.useEffect(() => {
    if (boot !== "ready") return;
    if (!roomFromUrl || !userId || !supabase) return;
    if (screen !== "entry") return;
    if (joinedFromUrlRef.current) return;
    joinedFromUrlRef.current = true;
    setJoinInput(roomFromUrl);
    void (async () => {
      setBusy(true);
      setErr(null);
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", userId)
          .maybeSingle();
        const { error } = await supabase.rpc("join_palabra_mp_room", {
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
        await attachChannel(roomFromUrl);
        setScreen("lobby");
      } catch (e) {
        joinedFromUrlRef.current = false;
        setErr(e instanceof Error ? e.message : "Could not join from link");
      } finally {
        setBusy(false);
      }
    })();
  }, [boot, roomFromUrl, userId, supabase, screen, countryCode, refreshState, attachChannel]);

  const createRoom = async () => {
    if (!supabase || !userId) return;
    console.log("[duende-mp] createRoom clicked", { difficultyPick });
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc("create_palabra_mp_room", {
        p_difficulty: difficultyPick,
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row?.out_room_code) throw new Error("No room code returned");
      const code = row.out_room_code;
      setRoomCode(code);
      await supabase
        .from("palabra_multiplayer_rooms")
        .update({ difficulty: difficultyPick })
        .eq("room_code", code);
      const ok = await refreshState(code);
      if (!ok) {
        setScreen("entry");
        return;
      }
      await attachChannel(code);
      setScreen("lobby");
    } catch (e) {
      console.error("[duende-mp] createRoom failed:", e);
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  const joinRoomManual = async () => {
    const code = normalizeRoomCode(joinInput);
    if (!supabase || !userId || code.length !== 6) {
      setErr("Enter a 6-character room code.");
      return;
    }
    console.log("[duende-mp] joinRoomManual", { code });
    setBusy(true);
    setErr(null);
    try {
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();
      const { error } = await supabase.rpc("join_palabra_mp_room", {
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
      await attachChannel(code);
      setScreen("lobby");
    } catch (e) {
      console.error("[duende-mp] joinRoomManual failed:", e);
      setErr(e instanceof Error ? e.message : "Join failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleReady = async () => {
    if (!supabase || !userId || !roomCode) return;
    const me = members.find((m) => m.user_id === userId);
    const next = !(me?.ready ?? false);
    await supabase.from("palabra_multiplayer_members").update({ ready: next }).eq("room_code", roomCode).eq("user_id", userId);
    await refreshState(roomCode);
  };

  const startGameAsHost = async () => {
    if (!supabase || !userId || !roomCode || !isHost) return;
    const readyMembers = members.filter((m) => m.ready);
    if (members.length < 2 || readyMembers.length < 2) {
      setErr("Both players must be ready.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const seed = crypto.randomUUID();
      const ends = Date.now() + MP_ROUND_MS;
      totalRoundsRef.current = room?.total_rounds ?? MP_DEFAULT_ROUNDS;
      targetScoreRef.current = room?.target_score ?? MP_TARGET_SCORE;
      const { error } = await supabase
        .from("palabra_multiplayer_rooms")
        .update({
          status: "playing",
          game_seed: seed,
          round_index: 0,
          round_ends_at: new Date(ends).toISOString(),
          difficulty: difficultyPick,
          total_rounds: MP_DEFAULT_ROUNDS,
          target_score: MP_TARGET_SCORE,
        })
        .eq("room_code", roomCode);
      if (error) throw error;
      const diff = (room?.difficulty as PalabraDifficultyLevel) ?? difficultyPick;
      const built = buildMpDeck(seed, diff, MP_DEFAULT_ROUNDS);
      setDeck(built);
      setScores({});
      setRoundIndex(0);
      roundResolvedRef.current = new Set();
      setRoundEndsAt(ends);
      roundStartMsRef.current = Date.now();
      setScreen("playing");
      setInput("");
      setSubmittedRound(null);
      sendPayload({
        t: "game_start",
        seed,
        difficulty: diff,
        totalRounds: MP_DEFAULT_ROUNDS,
        targetScore: MP_TARGET_SCORE,
        roundIndex: 0,
        roundEndsAt: ends,
      });
      await refreshState(roomCode);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Start failed");
    } finally {
      setBusy(false);
    }
  };

  const displayName = (uid: string) => profiles.get(uid)?.username ?? members.find((m) => m.user_id === uid)?.username_snapshot ?? "Player";

  const finalizeRoundHost = React.useCallback(
    async (firstUserId: string | null, round: number) => {
      if (!isHostRef.current || !supabase) return;
      if (roundResolvedRef.current.has(round)) return;
      roundResolvedRef.current.add(round);

      const nextScores = { ...scoresRef.current };
      for (const m of membersRef.current) {
        if (nextScores[m.user_id] === undefined) nextScores[m.user_id] = 0;
      }

      const strike: string | null = firstUserId;
      if (firstUserId) {
        nextScores[firstUserId] = (nextScores[firstUserId] ?? 0) + MP_BASE_SCORE + MP_STRIKE_BONUS;
        if (firstUserId === userIdRef.current) {
          bumpStrikeStats(round);
        }
      }

      setScores(nextScores);
      sendPayload({
        t: "resolve",
        roundIndex: round,
        firstUserId,
        scores: nextScores,
        strikeUserId: strike,
      });

      const hitTarget = Object.values(nextScores).some((s) => s >= targetScoreRef.current);
      const lastRound = round + 1 >= totalRoundsRef.current;

      if (hitTarget || lastRound) {
        await supabase
          .from("palabra_multiplayer_rooms")
          .update({ status: "finished", round_index: round + 1 })
          .eq("room_code", roomCodeRef.current);
        setScreen("summary");
        setSummaryBurst(true);
        return;
      }

      const nextR = round + 1;
      const ends = Date.now() + MP_ROUND_MS;
      await supabase
        .from("palabra_multiplayer_rooms")
        .update({
          round_index: nextR,
          round_ends_at: new Date(ends).toISOString(),
        })
        .eq("room_code", roomCodeRef.current);

      window.setTimeout(() => {
        sendPayload({ t: "round_start", roundIndex: nextR, roundEndsAt: ends });
      }, 2800);
    },
    [bumpStrikeStats, sendPayload, supabase],
  );

  React.useEffect(() => {
    finalizeRoundHostRef.current = finalizeRoundHost;
  }, [finalizeRoundHost]);

  React.useEffect(() => {
    if (!isHost || screen !== "playing" || roundEndsAt == null) return;
    const ms = Math.max(0, roundEndsAt - Date.now());
    const t = window.setTimeout(() => {
      void finalizeRoundHost(null, roundIndex);
    }, ms + 400);
    return () => clearTimeout(t);
  }, [isHost, screen, roundEndsAt, roundIndex, finalizeRoundHost]);

  const onSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || screen !== "playing") return;
    const entry = deck[roundIndex];
    if (!entry || submittedRound === roundIndex) return;
    const ok = checkTranslation(input, entry, "es-en");
    if (!ok) {
      setRoundMsg("Not quite — keep trying!");
      window.setTimeout(() => setRoundMsg(null), 1600);
      return;
    }
    setSubmittedRound(roundIndex);
    sendPayload({
      t: "claim",
      roundIndex,
      userId,
      at: Date.now(),
    });
    if (isHost) {
      void finalizeRoundHost(userId, roundIndex);
    }
  };

  React.useEffect(() => {
    if (screen !== "summary" || savedRun || !userId) return;
    setSavedRun(true);
    void recordPalabraRun({
      score: scores[userId] ?? 0,
      gameMode: "multiplayer",
      difficulty: (room?.difficulty as PalabraDifficultyLevel) ?? "medium",
      correctCount: myRoundsWon,
      totalQuestions: totalRoundsRef.current,
      vocabResults: vocabResults.length ? vocabResults : [{ spanish: "multiplayer", english: "session", correct: false }],
      gameRecordName: "palabra-vortex-multiplayer",
    });
  }, [screen, savedRun, userId, vocabResults, scores, room?.difficulty, myRoundsWon]);

  const msLeft = roundEndsAt ? Math.max(0, roundEndsAt - Date.now()) : 0;
  const secLeft = Math.ceil(msLeft / 1000);

  const shareUrl =
    typeof window !== "undefined" && roomCode
      ? `${window.location.origin}/games/palabra-vortex/multiplayer?room=${roomCode}`
      : "";

  const winnerId = React.useMemo(() => {
    if (screen !== "summary" || members.length === 0) return null;
    let best = members[0]!.user_id;
    for (const m of members) {
      if ((scores[m.user_id] ?? 0) > (scores[best] ?? -1)) best = m.user_id;
    }
    return best;
  }, [screen, members, scores]);

  const current = deck[roundIndex];

  if (boot === "checking") {
    return <MultiplayerConnectingSpinner context="boot: Supabase + auth" />;
  }

  if (boot === "failed") {
    return (
      <MultiplayerErrorPanel
        title={bootFailTitle}
        message={bootFailMessage}
        technical={bootFailTechnical}
      />
    );
  }

  if (!supabase) {
    console.error("[duende-mp] invariant: boot ready but supabase is null");
    return null;
  }

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/games"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <Gamepad2 className="size-4" />
            Back to Games
          </Link>
          <Link
            href="/games/palabra-vortex"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-muted-foreground")}
          >
            <ArrowLeft className="size-4" />
            Solo Vortex
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {conn === "ok" ? <Wifi className="size-4 text-emerald-400" /> : null}
          {conn === "reconnecting" ? <WifiOff className="size-4 text-amber-400" /> : null}
          {conn === "connecting" ? <span>Connecting…</span> : null}
          {conn === "reconnecting" ? <span>Reconnecting…</span> : null}
        </div>
      </div>

      <AnimatePresence>
        {partnerToast ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-fiesta-gold/35 bg-fiesta-crimson/90 px-5 py-2 text-sm font-medium text-foreground shadow-lg"
          >
            {partnerToast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {err && screen !== "entry" ? (
        <div
          className="mb-6 rounded-2xl border border-fiesta-orange/45 bg-fiesta-orange/10 p-4 shadow-sm"
          role="alert"
        >
          <p className="text-sm font-semibold text-foreground">Multiplayer error</p>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {err}
          </pre>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setErr(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {screen === "entry" && roomFromUrl && !err ? (
        <MultiplayerConnectingSpinner
          context="join-from-invite-link"
          title="Joining your room…"
          description={`Invite code ${roomFromUrl}. Tip: press F12 → Console and filter “duende-mp” if this takes too long.`}
        />
      ) : null}

      {screen === "entry" && roomFromUrl && err ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg">
          <Card className="border-fiesta-orange/35 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Couldn’t join from your link</CardTitle>
              <CardDescription>The invite code is in the address bar; you can retry or type it below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap break-words text-foreground">
                {err}
              </pre>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    console.log("[duende-mp] retry join from URL after error");
                    joinedFromUrlRef.current = false;
                    setErr(null);
                    window.location.reload();
                  }}
                >
                  Retry with same link
                </Button>
                <Button type="button" variant="outline" onClick={() => setErr(null)}>
                  Dismiss message
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {screen === "entry" && !roomFromUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex max-w-md flex-col items-center gap-8 py-6 text-center"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
              <Users className="size-3.5" />
              Palabra Vortex — 2 players
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
                Play together
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Same Spanish prompt on both phones — English answers stay short (1–3 words). New rooms get a 6-character
              code (like <span className="font-mono text-foreground">XN4RT2</span>).
            </p>
          </div>

          <div className="w-full space-y-3">
            <label className="block text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Difficulty for this room
            </label>
            <select
              value={difficultyPick}
              onChange={(e) => setDifficultyPick(e.target.value as PalabraDifficultyLevel)}
              className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"
            >
              <option value="easy">Fácil (A1–A2)</option>
              <option value="medium">Medio (B1)</option>
              <option value="hard">Difícil (B2)</option>
              <option value="expert">Experto (C1–C2)</option>
            </select>
            <Button
              type="button"
              size="lg"
              className="h-14 w-full gap-2 text-base font-semibold shadow-lg shadow-fiesta-gold/10"
              onClick={() => void createRoom()}
              disabled={busy}
            >
              <Sparkles className="size-5" />
              Create New Room
            </Button>
          </div>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="bg-background px-3 text-muted-foreground">or join</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <label className="block text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Room code (6 characters)
            </label>
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="e.g. SPAIN7"
              maxLength={8}
              className="w-full rounded-xl border-2 border-fiesta-gold/25 bg-background px-4 py-4 text-center font-mono text-xl tracking-[0.25em] placeholder:tracking-normal"
              autoComplete="off"
            />
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="h-14 w-full text-base font-semibold"
              onClick={() => void joinRoomManual()}
              disabled={busy}
            >
              Join Room
            </Button>
          </div>

          <div className="w-full rounded-xl border border-border/80 bg-muted/20 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Country flag (optional)</p>
            <input
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="GB, IT, …"
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase"
            />
          </div>

          {err ? (
            <div
              className="w-full rounded-xl border border-fiesta-orange/40 bg-fiesta-orange/10 p-4 text-left"
              role="alert"
            >
              <p className="text-sm font-semibold text-foreground">Something went wrong</p>
              <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {err}
              </pre>
            </div>
          ) : null}
        </motion.div>
      ) : null}

      {screen === "lobby" && !room ? (
        <Card className="border-fiesta-orange/30 bg-card/70">
          <CardHeader>
            <CardTitle className="text-lg">Loading room…</CardTitle>
            <CardDescription>
              If this stays empty for a long time, your Supabase project may be missing the multiplayer tables (migration
              006) or the room code is wrong.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {err ? (
              <p className="text-sm text-fiesta-orange" role="alert">
                {err}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Fetching room and players…</p>
            )}
            <Button type="button" variant="secondary" onClick={() => setScreen("entry")}>
              Back to setup
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {screen === "lobby" && room ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="border-fiesta-gold/25 bg-card/80">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-heading)]">
                Sala{" "}
                <span className="rounded-lg bg-muted px-3 py-1 font-mono text-2xl tracking-[0.2em] text-fiesta-gold">
                  {roomCode}
                </span>
              </CardTitle>
              <CardDescription>Vivís la misma partida; las respuestas en inglés siguen siendo cortas (1–3 palabras).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                >
                  <Copy className="size-4" />
                  Copy link
                </Button>
                <span className="text-xs text-muted-foreground break-all">{shareUrl}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {members.map((m) => {
                  const p = profiles.get(m.user_id);
                  const cc = m.country_code ?? countryCode;
                  return (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-3 rounded-xl border border-fiesta-gold/15 bg-fiesta-crimson/10 p-4"
                    >
                      <div className="flex size-12 items-center justify-center rounded-full bg-fiesta-crimson/25 text-2xl">
                        {p?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                        ) : (
                          (p?.username ?? "?").slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p?.username ?? m.username_snapshot ?? "Player"}</p>
                        <p className="text-xs text-muted-foreground">
                          {flagEmoji(cc)}{" "}
                          {m.user_id === room.host_id ? "Host · " : ""}
                          Connected from {countryLabel(cc)}
                        </p>
                        <p className="text-xs text-fiesta-gold">{m.ready ? "Ready ✓" : "Not ready"}</p>
                      </div>
                    </div>
                  );
                })}
                {members.length < 2 ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Waiting for your partner to join… share the link or code.
                  </p>
                ) : null}{" "}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant={members.find((m) => m.user_id === userId)?.ready ? "secondary" : "default"} onClick={() => void toggleReady()}>
                  {members.find((m) => m.user_id === userId)?.ready ? "Un-ready" : "Ready"}
                </Button>
                {isHost ? (
                  <Button
                    type="button"
                    className="gap-2"
                    disabled={
                      busy ||
                      members.length < 2 ||
                      members.filter((m) => m.ready).length < 2
                    }
                    onClick={() => void startGameAsHost()}
                  >
                    <Zap className="size-4" />
                    Start game
                  </Button>
                ) : (
                  <p className="self-center text-sm text-muted-foreground">Host starts when both are ready.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Quick reactions:</span>
                {PRESET_REACTIONS.map((pr) => (
                  <Button
                    key={pr}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full text-xs"
                    onClick={() => userId && sendPayload({ t: "reaction", userId, preset: pr })}
                  >
                    {pr}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {screen === "playing" && !current ? (
        <Card className="border-fiesta-gold/25 bg-card/80">
          <CardHeader>
            <CardTitle className="text-lg">Syncing round…</CardTitle>
            <CardDescription>Waiting for the deck and timer from the host. Check your connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => void refreshState(roomCode)}>
              Retry refresh
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {screen === "playing" && current ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {members.map((m) => {
              const pts = scores[m.user_id] ?? 0;
              const p = profiles.get(m.user_id);
              const isMe = m.user_id === userId;
              const maxPts = Math.max(MP_TARGET_SCORE, ...Object.values(scores), 1);
              return (
                <Card key={m.user_id} className={cn("border-fiesta-gold/15", isMe && "ring-1 ring-fiesta-gold/35")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {isMe ? "You" : displayName(m.user_id)}{" "}
                      <span className="text-lg">{flagEmoji(m.country_code ?? countryCode)}</span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {countryLabel(m.country_code ?? countryCode)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Score</span>
                      <span className="font-mono font-bold text-fiesta-gold">{pts}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full bg-linear-to-r from-fiesta-crimson to-fiesta-gold"
                        initial={false}
                        animate={{ width: `${Math.min(100, (pts / maxPts) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{p?.username}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="relative overflow-hidden border-fiesta-gold/25 bg-card/85">
            <FieryBurst trigger={strikeBurst} intensity="mega" />
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-fiesta-crimson/20 px-2 py-1 text-xs font-bold text-fiesta-gold">
                  Round {roundIndex + 1}/{totalRoundsRef.current}
                </span>
                <ItemBadge type={current.itemType} />
              </div>
              <span className="font-mono text-lg text-fiesta-orange">{secLeft}s</span>
            </CardHeader>
            <CardContent>
              <p className="font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground sm:text-4xl">
                {current.es}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Spanish → English (1–3 words)</p>
              <form onSubmit={onSubmitAnswer} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={submittedRound === roundIndex}
                  placeholder="Your English answer…"
                  className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  autoComplete="off"
                />
                <Button type="submit" disabled={submittedRound === roundIndex}>
                  Submit
                </Button>
              </form>
              {roundMsg ? <p className="mt-3 text-sm text-fiesta-gold">{roundMsg}</p> : null}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 border-t border-border/60">
              {PRESET_REACTIONS.slice(0, 3).map((pr) => (
                <Button
                  key={pr}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => userId && sendPayload({ t: "reaction", userId, preset: pr })}
                >
                  {pr}
                </Button>
              ))}
            </CardFooter>
          </Card>
        </motion.div>
      ) : null}

      {screen === "summary" ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {!reduceMotion ? (
            <VictoryConfetti
              active={summaryBurst && Boolean(userId && winnerId === userId)}
              className="pointer-events-none fixed inset-0 z-0"
            />
          ) : null}
          <Card className="relative z-10 border-fiesta-gold/35 bg-card/90">
            <CardHeader>
              <div className="flex items-center gap-2 text-fiesta-gold">
                <Trophy className="size-6" />
                <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">Fin del duelo</CardTitle>
              </div>
              <CardDescription>Great mix of words and expressions — even across borders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {members.map((m) => (
                  <li key={m.user_id} className="flex justify-between gap-4 rounded-lg bg-muted/40 px-3 py-2">
                    <span className="flex items-center gap-2">
                      {displayName(m.user_id)} {flagEmoji(m.country_code ?? countryCode)}
                    </span>
                    <span className="font-mono font-bold text-fiesta-gold">{scores[m.user_id] ?? 0}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-fiesta-gold/20 bg-fiesta-crimson/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-fiesta-gold">
                  <Heart className="size-4" /> Funny stats
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>
                    Fastest translator:{" "}
                    {(fastestMs ?? 999) < 900
                      ? `${((fastestMs as number) / 1000).toFixed(1)}s reaction`
                      : "Both brought fuego 🔥"}
                  </li>
                  <li>Idiom master: {idiomHits} idioms nailed</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3">
              {isHost ? (
                <Button
                  type="button"
                  className="gap-2"
                  onClick={() => {
                    if (!supabase || !roomCode) return;
                    void supabase.rpc("rematch_palabra_mp_room", { p_room_code: roomCode }).then(() => {
                      sendPayload({ t: "rematch" });
                      void refreshState(roomCode);
                    });
                  }}
                >
                  Rematch (same room)
                </Button>
              ) : null}
              <Link
                href="/games/palabra-vortex/multiplayer"
                className={cn(buttonVariants({ variant: "outline", size: "default" }))}
              >
                New lobby
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}
