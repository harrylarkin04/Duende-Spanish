"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  FastForward,
  Flame,
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
import { buildMaskedEnglishHint, checkTranslation } from "@/lib/games/palabra-vortex/game-utils";
import type { PalabraDifficultyLevel, PalabraEntry, PalabraItemType } from "@/lib/games/palabra-vortex/types";
import {
  countryLabel,
  flagEmoji,
  MP_BASE_SCORE,
  MP_BROADCAST_EVENT,
  MP_DEFAULT_ROUNDS,
  MP_HINT_AFTER_MS,
  MP_MONSTER_MAX_HP,
  MP_ROUND_BOSS_MONSTERS,
  MP_ROUND_MS,
  MP_SKIP_COOLDOWN_MS,
  MP_STRIKE_BONUS,
  MP_TARGET_SCORE,
  playerGladiatorMonster,
  roundBossMonster,
  strikeMonsterDamage,
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

const WINNER_STRIKE_TAUNTS = [
  "¡Duende Strike! 🔥 You destroyed them!",
  "¡Gané! Better luck next round loser ❤️",
  "Too fast for love — they’re still loading 😏",
  "Spanish police called — they’re fine, you’re just slower 😎",
];

const LOSER_STRIKE_TAUNTS = [
  "Too slow, mi amor 😏",
  "Spanish police called — you're under arrest for being too slow",
  "They struck first — send hearts, not excuses 💋",
  "¡Qué drama! You’ll get the next one ❤️",
];

const SILLY_POP_REACTIONS = [
  "¡Olé!",
  "¡Qué vergüenza!",
  "My abuela translates faster than you 😂",
  "¡Boobies! ✨",
];

const MP_ANSWER_PLACEHOLDERS = [
  "Type your English here…",
  "Type the translation here…",
  "English answer (1–3 words)…",
  "What’s this in English?",
  "Your strike in English…",
] as const;

/** Min players to start; max must match `join_palabra_mp_room` cap (see migration 008). */
const MP_MIN_PLAYERS = 2;
const MP_MAX_PLAYERS = 3;

const LOBBY_QUICK_REACTIONS = [
  "¡Vamos! 💪",
  "Too slow 😜",
  "Good one ❤️",
  "Te extraño ya ❤️",
  "🔥🔥🔥",
  "Ready when you are 😈",
  "¡Boobies! ✨",
];

const IN_GAME_EMOJI_PRESETS = [
  "❤️",
  "🔥",
  "😏",
  "😂",
  "💋",
  "✨",
  "🍈",
  "¡Olé!",
  "¡Boobies! ✨",
];

const SKIP_MESSAGES = [
  "Too hard? No shame in skipping ❤️",
  "Skipped! Even natives struggle sometimes 😂",
  "Coward move activated 🏃‍♀️",
  "Tactical retreat — your monster fled! 🥴",
];

type BattleFx =
  | { kind: "hit"; victimId: string; amount: number; attackerId: string }
  | { kind: "skip"; runnerId: string };

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

function MonsterHpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  return (
    <div className="h-3 overflow-hidden rounded-full border border-fiesta-gold/35 bg-muted/80 shadow-inner">
      <motion.div
        className="h-full bg-linear-to-r from-emerald-500 via-amber-400 to-fiesta-crimson"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      />
    </div>
  );
}

function HintMaskedEnglish({ text, seed }: { text: string; seed: number }) {
  return <span className="inline leading-relaxed tracking-wide">{buildMaskedEnglishHint(text, seed)}</span>;
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
  /** After resolve, block input until next `round_start` (same server round index). */
  const [lockedRoundIndex, setLockedRoundIndex] = React.useState<number | null>(null);
  const [localCorrectFlash, setLocalCorrectFlash] = React.useState(false);
  const [hintVisible, setHintVisible] = React.useState(false);
  const [localStrikeToast, setLocalStrikeToast] = React.useState<string | null>(null);
  const [sillyPop, setSillyPop] = React.useState<string | null>(null);
  const [correctReveal, setCorrectReveal] = React.useState<{
    roundIndex: number;
    who: "you" | "partner";
    spanish: string;
    english: string;
    alternatives?: string[];
    hint: string;
    itemType?: PalabraItemType;
  } | null>(null);
  const [failedReveal, setFailedReveal] = React.useState<{
    roundIndex: number;
    spanish: string;
    english: string;
    alternatives?: string[];
    hint: string;
    itemType?: PalabraItemType;
  } | null>(null);
  const [nicknameDraft, setNicknameDraft] = React.useState("");
  const [nickBusy, setNickBusy] = React.useState(false);
  const [reactionLog, setReactionLog] = React.useState<Array<{ userId: string; preset: string; at: number }>>([]);
  const [hintsByUser, setHintsByUser] = React.useState<Record<string, number>>({});
  const [fastestByUser, setFastestByUser] = React.useState<Record<string, number>>({});
  const [idiomStrikesByUser, setIdiomStrikesByUser] = React.useState<Record<string, number>>({});

  const [gameSeed, setGameSeed] = React.useState("");
  const [monsterHp, setMonsterHp] = React.useState<Record<string, number>>({});
  const [rageUsedMap, setRageUsedMap] = React.useState<Record<string, boolean>>({});
  const [summaryKoWinnerId, setSummaryKoWinnerId] = React.useState<string | null>(null);
  const [battleFx, setBattleFx] = React.useState<BattleFx | null>(null);
  const [rageBurst, setRageBurst] = React.useState(0);

  const [myRoundsWon, setMyRoundsWon] = React.useState(0);
  const [fastestMs, setFastestMs] = React.useState<number | null>(null);
  const [idiomHits, setIdiomHits] = React.useState(0);
  const [vocabResults, setVocabResults] = React.useState<PalabraVocabResult[]>([]);
  const [savedRun, setSavedRun] = React.useState(false);

  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const finalizeRoundHostRef = React.useRef<
    (
      firstUid: string | null,
      round: number,
      claimedAt?: number,
      skipUserId?: string | null,
    ) => Promise<void>
  >(async () => {});
  /** Host-only: prevents double finalize (claim / skip / timer) for the same round. */
  const hostFinalizedRoundRef = React.useRef<Set<number>>(new Set());
  /** All clients: apply resolve-driven UI (stats, FX, toasts) exactly once per round. */
  const resolveUiAppliedRef = React.useRef<Set<number>>(new Set());
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
  /** When false, lobby nickname field syncs from server/profile; set true on user edit. */
  const nickTouchedRef = React.useRef(false);
  const gameSeedRef = React.useRef("");
  const monsterHpRef = React.useRef<Record<string, number>>({});
  const rageRoundByUserRef = React.useRef<Record<string, number | undefined>>({});
  const rageUsedHostRef = React.useRef<Record<string, boolean>>({});
  const roundIndexRef = React.useRef(0);
  const gameAnswerInputRef = React.useRef<HTMLInputElement>(null);
  const skipCooldownUntilByUserRef = React.useRef<Record<string, number>>({});

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

  React.useEffect(() => {
    roundIndexRef.current = roundIndex;
  }, [roundIndex]);

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
        " If this is your project, run supabase/migrations/006–008 (Palabra multiplayer, including 3-player join) in the Supabase SQL editor.";

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

  const bumpStrikeStats = React.useCallback((roundIdx: number, winnerReactMs?: number | null) => {
    setMyRoundsWon((x) => x + 1);
    setStrikeBurst((k) => k + 1);
    const entry = deckRef.current[roundIdx];
    if (entry) {
      setVocabResults((v) => [...v, { spanish: entry.es, english: entry.en, correct: true }]);
      if (entry.itemType === "idiom") setIdiomHits((x) => x + 1);
      if (winnerReactMs != null) {
        setFastestMs((prev) => (prev == null ? winnerReactMs : Math.min(prev, winnerReactMs)));
      }
    }
  }, []);

  const displayNameFromRefs = React.useCallback((uid: string) => {
    const mem = membersRef.current.find((m) => m.user_id === uid);
    const nick = mem?.match_nickname?.trim();
    if (nick) return nick;
    return profilesRef.current.get(uid)?.username ?? mem?.username_snapshot ?? "Player";
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
            if (hostFinalizedRoundRef.current.has(p.roundIndex)) return;
            void finalizeRoundHostRef.current(p.userId, p.roundIndex, p.at);
            return;
          }

          if (p.t === "skip_request") {
            if (!isHostRef.current) return;
            if (hostFinalizedRoundRef.current.has(p.roundIndex)) return;
            if (p.roundIndex !== roundIndexRef.current) return;
            const lastAt = skipCooldownUntilByUserRef.current[p.userId] ?? 0;
            if (p.at < lastAt) return;
            skipCooldownUntilByUserRef.current[p.userId] = p.at + MP_SKIP_COOLDOWN_MS;
            void finalizeRoundHostRef.current(null, p.roundIndex, undefined, p.userId);
            return;
          }

          if (p.t === "duende_rage") {
            if (isHostRef.current) {
              if (rageUsedHostRef.current[p.userId]) return;
              if (p.roundIndex !== roundIndexRef.current) return;
              rageUsedHostRef.current[p.userId] = true;
              rageRoundByUserRef.current[p.userId] = p.roundIndex;
            }
            setRageUsedMap((prev) => ({ ...prev, [p.userId]: true }));
            const who = displayNameFromRefs(p.userId);
            const mine = userIdRef.current;
            if (p.userId === mine) {
              setLocalStrikeToast("Duende Rage armed — nail this round for 2× strike points! ⚡");
              window.setTimeout(() => setLocalStrikeToast(null), 3200);
            } else {
              setPartnerToast(`${who} armed Duende Rage! ⚡🔥`);
              window.setTimeout(() => setPartnerToast(null), 3200);
            }
            return;
          }

          if (p.t === "game_start") {
            hostFinalizedRoundRef.current = new Set();
            resolveUiAppliedRef.current = new Set();
            setLockedRoundIndex(null);
            setLocalCorrectFlash(false);
            totalRoundsRef.current = p.totalRounds;
            targetScoreRef.current = p.targetScore;
            gameSeedRef.current = p.seed;
            setGameSeed(p.seed);
            const initHp: Record<string, number> = {};
            for (const m of membersRef.current) {
              initHp[m.user_id] = MP_MONSTER_MAX_HP;
            }
            monsterHpRef.current = initHp;
            setMonsterHp(initHp);
            rageRoundByUserRef.current = {};
            rageUsedHostRef.current = {};
            setRageUsedMap({});
            setSummaryKoWinnerId(null);
            setBattleFx(null);
            const d = buildMpDeck(p.seed, p.difficulty, p.totalRounds);
            setDeck(d);
            setRoundIndex(p.roundIndex);
            setRoundEndsAt(p.roundEndsAt);
            roundStartMsRef.current = Date.now();
            setScreen("playing");
            setInput("");
            setSubmittedRound(null);
            setRoundMsg(null);
            setHintVisible(false);
            setHintsByUser({});
            setFastestByUser({});
            setIdiomStrikesByUser({});
            skipCooldownUntilByUserRef.current = {};
            setReactionLog([]);
            setLocalStrikeToast(null);
            setSillyPop(null);
            setCorrectReveal(null);
            setFailedReveal(null);
            return;
          }

          if (p.t === "round_start") {
            setRoundIndex(p.roundIndex);
            setRoundEndsAt(p.roundEndsAt);
            roundStartMsRef.current = Date.now();
            setInput("");
            setSubmittedRound(null);
            setLockedRoundIndex(null);
            setLocalCorrectFlash(false);
            setRoundMsg(null);
            setHintVisible(false);
            setCorrectReveal(null);
            setFailedReveal(null);
            return;
          }

          if (p.t === "resolve") {
            if (resolveUiAppliedRef.current.has(p.roundIndex)) return;
            resolveUiAppliedRef.current.add(p.roundIndex);
            setLockedRoundIndex(p.roundIndex);
            setScores({ ...p.scores });
            const mine = userIdRef.current;
            if (p.skippedBy) {
              setCorrectReveal(null);
              setFailedReveal(null);
            }

            if (p.monsterHp) {
              monsterHpRef.current = p.monsterHp;
              setMonsterHp({ ...p.monsterHp });
            }
            if (p.koWinnerId) {
              setSummaryKoWinnerId(p.koWinnerId);
            }
            if (p.battleDamage) {
              setBattleFx({
                kind: "hit",
                victimId: p.battleDamage.victimId,
                amount: p.battleDamage.amount,
                attackerId: p.battleDamage.attackerId,
              });
            } else if (p.skippedBy) {
              setBattleFx({ kind: "skip", runnerId: p.skippedBy });
            }
            if (p.strikeScoreDoubled) {
              setRageBurst((k) => k + 1);
            }

            if (p.winnerReactMs != null && p.strikeUserId) {
              setFastestByUser((prev) => {
                const w = p.strikeUserId!;
                const ms = p.winnerReactMs!;
                const cur = prev[w];
                if (cur == null || ms < cur) return { ...prev, [w]: ms };
                return prev;
              });
            }
            if (p.strikeWasIdiom && p.strikeUserId) {
              setIdiomStrikesByUser((prev) => ({
                ...prev,
                [p.strikeUserId!]: (prev[p.strikeUserId!] ?? 0) + 1,
              }));
            }

            if (p.strikeUserId && p.strikeUserId === mine) {
              bumpStrikeStats(p.roundIndex, p.winnerReactMs ?? null);
            }

            // Reveal the full meaning + usage note for the round winner.
            if (!p.skippedBy && p.firstUserId) {
              const entry = deckRef.current[p.roundIndex];
              if (entry) {
                setHintVisible(false);
                setCorrectReveal({
                  roundIndex: p.roundIndex,
                  who: p.firstUserId === mine ? "you" : "partner",
                  spanish: entry.es,
                  english: entry.en,
                  alternatives: entry.acceptedEn,
                  hint: entry.hint,
                  itemType: entry.itemType,
                });
                window.setTimeout(() => setCorrectReveal(null), 3500);
              }
            } else if (!p.skippedBy) {
              const entry = deckRef.current[p.roundIndex];
              if (entry) {
                setHintVisible(false);
                setFailedReveal({
                  roundIndex: p.roundIndex,
                  spanish: entry.es,
                  english: entry.en,
                  alternatives: entry.acceptedEn,
                  hint: entry.hint,
                  itemType: entry.itemType,
                });
                window.setTimeout(() => setFailedReveal(null), 4200);
              }
            }

            if (p.skippedBy) {
              const line = SKIP_MESSAGES[Math.floor(Math.random() * SKIP_MESSAGES.length)];
              setRoundMsg(line);
              window.setTimeout(() => setRoundMsg(null), 4200);
              const skipper = displayNameFromRefs(p.skippedBy);
              if (p.skippedBy === mine) {
                setLocalStrikeToast(`You hit Skip — ${line}`);
                window.setTimeout(() => setLocalStrikeToast(null), 4200);
              } else {
                setPartnerToast(`${skipper} hit Skip — ${line}`);
                window.setTimeout(() => setPartnerToast(null), 4200);
              }
            } else if (p.firstUserId) {
              const w = p.firstUserId;
              if (w === mine) {
                let line =
                  WINNER_STRIKE_TAUNTS[Math.floor(Math.random() * WINNER_STRIKE_TAUNTS.length)];
                if (p.strikeScoreDoubled) line = `${line} ⚡ 2× Duende Rage!`;
                setLocalStrikeToast(line);
                window.setTimeout(() => setLocalStrikeToast(null), 3400);
                const silly =
                  SILLY_POP_REACTIONS[Math.floor(Math.random() * SILLY_POP_REACTIONS.length)];
                setSillyPop(silly);
                window.setTimeout(() => setSillyPop(null), 2400);
              } else {
                const line =
                  LOSER_STRIKE_TAUNTS[Math.floor(Math.random() * LOSER_STRIKE_TAUNTS.length)];
                const extra = p.strikeScoreDoubled ? " (they had Duende Rage! ⚡)" : "";
                setPartnerToast(`${line}${extra}`);
                window.setTimeout(() => setPartnerToast(null), 3800);
              }
            }

            if (p.strikeUserId) {
              setStrikeBurst((k) => k + 1);
            }

            const r = p.skippedBy
              ? `Round ${p.roundIndex + 1} — Skipped`
              : `Round ${p.roundIndex + 1} — ${p.strikeUserId ? "Duende Strike!" : "Time's up or draw"}`;
            if (!p.skippedBy) {
              setRoundMsg(r);
              window.setTimeout(() => setRoundMsg(null), 2800);
            }
            return;
          }

          if (p.t === "reaction") {
            setReactionLog((log) => [...log.slice(-40), { userId: p.userId, preset: p.preset, at: Date.now() }]);
            if (p.userId === userIdRef.current) return;
            const who = displayNameFromRefs(p.userId);
            setPartnerToast(`${who}: ${p.preset}`);
            window.setTimeout(() => setPartnerToast(null), 3200);
            return;
          }

          if (p.t === "hint_spent") {
            setHintsByUser((prev) => ({
              ...prev,
              [p.userId]: (prev[p.userId] ?? 0) + 1,
            }));
            return;
          }

          if (p.t === "rematch") {
            hostFinalizedRoundRef.current = new Set();
            resolveUiAppliedRef.current = new Set();
            setLockedRoundIndex(null);
            setLocalCorrectFlash(false);
            setDeck([]);
            setScores({});
            setGameSeed("");
            gameSeedRef.current = "";
            monsterHpRef.current = {};
            setMonsterHp({});
            rageRoundByUserRef.current = {};
            rageUsedHostRef.current = {};
            setRageUsedMap({});
            setSummaryKoWinnerId(null);
            setBattleFx(null);
            setScreen("lobby");
            setSummaryBurst(false);
            setSavedRun(false);
            setMyRoundsWon(0);
            setFastestMs(null);
            setIdiomHits(0);
            setVocabResults([]);
            setHintsByUser({});
            setFastestByUser({});
            setIdiomStrikesByUser({});
            setReactionLog([]);
            setHintVisible(false);
            setLocalStrikeToast(null);
            setSillyPop(null);
            setCorrectReveal(null);
            setFailedReveal(null);
            nickTouchedRef.current = false;
            skipCooldownUntilByUserRef.current = {};
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
            gameSeedRef.current = r.game_seed;
            setGameSeed(r.game_seed);
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
    [supabase, userId, teardownChannel, refreshState, countryCode, bumpStrikeStats, displayNameFromRefs],
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
    if (members.length < MP_MIN_PLAYERS || members.length > MP_MAX_PLAYERS) {
      setErr(`Need between ${MP_MIN_PLAYERS} and ${MP_MAX_PLAYERS} players to start.`);
      return;
    }
    if (readyMembers.length !== members.length) {
      setErr("Everyone in the room must tap Ready before starting.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const seed = crypto.randomUUID();
      gameSeedRef.current = seed;
      setGameSeed(seed);
      const initHp: Record<string, number> = {};
      for (const m of members) {
        initHp[m.user_id] = MP_MONSTER_MAX_HP;
      }
      monsterHpRef.current = initHp;
      setMonsterHp(initHp);
      rageRoundByUserRef.current = {};
      rageUsedHostRef.current = {};
      setRageUsedMap({});
      setSummaryKoWinnerId(null);
      setBattleFx(null);
      setFailedReveal(null);
      skipCooldownUntilByUserRef.current = {};
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
      hostFinalizedRoundRef.current = new Set();
      resolveUiAppliedRef.current = new Set();
      setRoundEndsAt(ends);
      roundStartMsRef.current = Date.now();
      setScreen("playing");
      setInput("");
      setSubmittedRound(null);
      setLockedRoundIndex(null);
      setLocalCorrectFlash(false);
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

  const displayName = (uid: string) => {
    const mem = members.find((m) => m.user_id === uid);
    const nick = mem?.match_nickname?.trim();
    if (nick) return nick;
    return profiles.get(uid)?.username ?? mem?.username_snapshot ?? "Player";
  };

  React.useEffect(() => {
    nickTouchedRef.current = false;
  }, [roomCode]);

  React.useEffect(() => {
    if (screen !== "lobby" || !userId || members.length === 0) return;
    if (nickTouchedRef.current) return;
    const me = members.find((m) => m.user_id === userId);
    if (!me) return;
    setNicknameDraft(
      me.match_nickname?.trim() ||
        profiles.get(userId)?.username ||
        me.username_snapshot ||
        "",
    );
  }, [screen, userId, members, profiles]);

  const saveMatchNickname = React.useCallback(async () => {
    if (!supabase || !userId || !roomCode) return;
    const trimmed = nicknameDraft.trim().slice(0, 40);
    setNickBusy(true);
    try {
      const value = trimmed.length ? trimmed : null;
      const { data: updated, error } = await supabase
        .from("palabra_multiplayer_members")
        .update({ match_nickname: value })
        .eq("room_code", roomCode)
        .eq("user_id", userId)
        .select("user_id, match_nickname")
        .maybeSingle();
      if (error) throw error;
      if (updated) {
        setMembers((prev) =>
          prev.map((m) => (m.user_id === userId ? { ...m, match_nickname: updated.match_nickname } : m)),
        );
        nickTouchedRef.current = false;
      }
      await refreshState(roomCode, "soft");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save nickname");
    } finally {
      setNickBusy(false);
    }
  }, [supabase, userId, roomCode, nicknameDraft, refreshState]);

  React.useEffect(() => {
    if (screen !== "playing" || roundEndsAt == null) return;
    setHintVisible(false);
    if (!userId) return;
    const entry = deckRef.current[roundIndex];
    if (!entry || submittedRound === roundIndex || lockedRoundIndex === roundIndex) return;
    const tid = window.setTimeout(() => {
      setHintVisible(true);
      sendPayload({ t: "hint_spent", roundIndex, userId });
    }, MP_HINT_AFTER_MS);
    return () => window.clearTimeout(tid);
  }, [screen, roundIndex, roundEndsAt, submittedRound, lockedRoundIndex, userId, sendPayload]);

  React.useEffect(() => {
    if (screen !== "playing") return;
    const t = window.setTimeout(() => gameAnswerInputRef.current?.focus(), 90);
    return () => window.clearTimeout(t);
  }, [screen, roundIndex]);

  const finalizeRoundHost = React.useCallback(
    async (
      firstUserId: string | null,
      round: number,
      claimedAt?: number,
      skipUserId?: string | null,
    ) => {
      if (!isHostRef.current || !supabase) return;
      if (hostFinalizedRoundRef.current.has(round)) return;
      hostFinalizedRoundRef.current.add(round);

      const memberList = membersRef.current;
      const nextScores = { ...scoresRef.current };
      for (const m of memberList) {
        if (nextScores[m.user_id] === undefined) nextScores[m.user_id] = 0;
      }

      const nextHp: Record<string, number> = { ...monsterHpRef.current };
      for (const m of memberList) {
        if (nextHp[m.user_id] == null) nextHp[m.user_id] = MP_MONSTER_MAX_HP;
      }

      const skippedBy = skipUserId ?? null;
      let battleDamage: { victimId: string; amount: number; attackerId: string } | null = null;
      let strikeScoreDoubled = false;
      const strike: string | null = skippedBy ? null : firstUserId;

      if (skippedBy) {
        /* no score / no hp */
      } else if (firstUserId) {
        const others = memberList
          .filter((m) => m.user_id !== firstUserId)
          .map((m) => m.user_id)
          .sort((a, b) => a.localeCompare(b));
        const victim = others.length === 0 ? null : others[round % others.length]!;
        if (victim) {
          const dmg = strikeMonsterDamage(round, gameSeedRef.current);
          nextHp[victim] = Math.max(0, (nextHp[victim] ?? MP_MONSTER_MAX_HP) - dmg);
          battleDamage = { victimId: victim, amount: dmg, attackerId: firstUserId };
        }
        let gain = MP_BASE_SCORE + MP_STRIKE_BONUS;
        if (rageRoundByUserRef.current[firstUserId] === round) {
          gain *= 2;
          strikeScoreDoubled = true;
          delete rageRoundByUserRef.current[firstUserId];
        }
        nextScores[firstUserId] = (nextScores[firstUserId] ?? 0) + gain;
      }

      monsterHpRef.current = nextHp;
      setMonsterHp({ ...nextHp });

      let winnerReactMs: number | null = null;
      if (firstUserId != null && claimedAt != null && !skippedBy) {
        winnerReactMs = Math.max(0, claimedAt - roundStartMsRef.current);
      }
      const strikeWasIdiom = Boolean(!skippedBy && firstUserId && deckRef.current[round]?.itemType === "idiom");

      let koWinnerId: string | null = null;
      if (memberList.length >= 2) {
        const alive = memberList.filter((m) => (nextHp[m.user_id] ?? 0) > 0);
        if (alive.length === 1) koWinnerId = alive[0]!.user_id;
      }

      setScores(nextScores);
      sendPayload({
        t: "resolve",
        roundIndex: round,
        firstUserId: skippedBy ? null : firstUserId,
        scores: nextScores,
        strikeUserId: strike,
        winnerReactMs,
        strikeWasIdiom,
        monsterHp: { ...nextHp },
        skippedBy,
        koWinnerId,
        battleDamage,
        strikeScoreDoubled,
      });

      const hitTarget = Object.values(nextScores).some((s) => s >= targetScoreRef.current);
      const lastRound = round + 1 >= totalRoundsRef.current;

      if (koWinnerId || hitTarget || lastRound) {
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
    [sendPayload, supabase],
  );

  React.useEffect(() => {
    finalizeRoundHostRef.current = finalizeRoundHost;
  }, [finalizeRoundHost]);

  React.useEffect(() => {
    if (!isHost || screen !== "playing" || roundEndsAt == null) return;
    const ms = Math.max(0, roundEndsAt - Date.now());
    const t = window.setTimeout(() => {
      void finalizeRoundHost(null, roundIndex, undefined, null);
    }, ms + 400);
    return () => clearTimeout(t);
  }, [isHost, screen, roundEndsAt, roundIndex, finalizeRoundHost]);

  const onSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || screen !== "playing") return;
    const entry = deck[roundIndex];
    if (!entry || submittedRound === roundIndex || lockedRoundIndex === roundIndex) return;
    const ok = checkTranslation(input, entry, "es-en");
    if (!ok) {
      setRoundMsg("Not quite — keep trying!");
      window.setTimeout(() => setRoundMsg(null), 1600);
      return;
    }
    setHintVisible(false);
    setInput("");
    setLocalCorrectFlash(true);
    window.setTimeout(() => setLocalCorrectFlash(false), 800);
    setSubmittedRound(roundIndex);
    const at = Date.now();
    sendPayload({
      t: "claim",
      roundIndex,
      userId,
      at,
    });
    if (isHost) {
      void finalizeRoundHost(userId, roundIndex, at, null);
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
    if (summaryKoWinnerId) return summaryKoWinnerId;
    let best = members[0]!.user_id;
    for (const m of members) {
      if ((scores[m.user_id] ?? 0) > (scores[best] ?? -1)) best = m.user_id;
    }
    return best;
  }, [screen, members, scores, summaryKoWinnerId]);

  const current = deck[roundIndex];
  const inputLockedPlaying =
    submittedRound === roundIndex || lockedRoundIndex === roundIndex;
  const mpAnswerPlaceholder =
    MP_ANSWER_PLACEHOLDERS[roundIndex % MP_ANSWER_PLACEHOLDERS.length]!;
  /** Submitted a correct claim; blocked locally until host `resolve` arrives. */
  const waitingForPartnerSync =
    screen === "playing" &&
    submittedRound === roundIndex &&
    lockedRoundIndex !== roundIndex;

  const hintSeed = React.useMemo(
    () => (current ? roundIndex * 131 + current.en.length * 17 : 0),
    [current, roundIndex],
  );

  const otherMembersPlaying = React.useMemo(() => {
    if (!userId) return [];
    return members
      .filter((m) => m.user_id !== userId)
      .sort((a, b) => a.user_id.localeCompare(b.user_id));
  }, [members, userId]);
  const myPts = userId ? (scores[userId] ?? 0) : 0;
  const maxOtherPts =
    otherMembersPlaying.length > 0
      ? Math.max(...otherMembersPlaying.map((m) => scores[m.user_id] ?? 0))
      : 0;
  const scoreTaunt =
    otherMembersPlaying.length === 0
      ? "Waiting for your squad 💞"
      : myPts > maxOtherPts
        ? "You're in the lead ❤️"
        : myPts < maxOtherPts
          ? "Chase the leaders 😈"
          : "Dead heat — turn up the heat 🔥";

  const hintLeaderUid = React.useMemo(() => {
    if (members.length < 2) return null;
    let best = -1;
    for (const m of members) best = Math.max(best, hintsByUser[m.user_id] ?? 0);
    if (best <= 0) return null;
    const top = members.filter((m) => (hintsByUser[m.user_id] ?? 0) === best);
    return top.length === 1 ? top[0]!.user_id : null;
  }, [members, hintsByUser]);

  const fastestDuendeUid = React.useMemo(() => {
    let best: string | null = null;
    let bestMs = Infinity;
    for (const m of members) {
      const ms = fastestByUser[m.user_id];
      if (ms != null && ms < bestMs) {
        bestMs = ms;
        best = m.user_id;
      }
    }
    return best;
  }, [members, fastestByUser]);

  const idiomSlayerUid = React.useMemo(() => {
    if (members.length < 2) return null;
    let best = -1;
    for (const m of members) best = Math.max(best, idiomStrikesByUser[m.user_id] ?? 0);
    if (best <= 0) return null;
    const top = members.filter((m) => (idiomStrikesByUser[m.user_id] ?? 0) === best);
    return top.length === 1 ? top[0]!.user_id : null;
  }, [members, idiomStrikesByUser]);

  const [uiTick, setUiTick] = React.useState(0);
  React.useEffect(() => {
    if (screen !== "playing" || roundEndsAt == null) return;
    const id = window.setInterval(() => setUiTick((x) => x + 1), 220);
    return () => window.clearInterval(id);
  }, [screen, roundIndex, roundEndsAt]);

  const { skipEnabled, skipCooldownLeftMs } = React.useMemo(() => {
    void uiTick;
    if (!userId) return { skipEnabled: false, skipCooldownLeftMs: 0 };
    const now = Date.now();
    const cooldownUntil = skipCooldownUntilByUserRef.current[userId] ?? 0;
    const cooldownLeft = Math.max(0, cooldownUntil - now);
    return {
      skipEnabled:
        screen === "playing" &&
        submittedRound !== roundIndex &&
        lockedRoundIndex !== roundIndex &&
        cooldownLeft <= 0,
      skipCooldownLeftMs: cooldownLeft,
    };
  }, [screen, submittedRound, lockedRoundIndex, roundIndex, uiTick, userId]);

  const roundBoss = React.useMemo(
    () => (gameSeed ? roundBossMonster(roundIndex, gameSeed) : MP_ROUND_BOSS_MONSTERS[0]),
    [gameSeed, roundIndex],
  );

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
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
        {localStrikeToast ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="pointer-events-none fixed top-20 left-1/2 z-50 max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-fiesta-gold/45 bg-linear-to-r from-fiesta-crimson/95 to-fiesta-orange/90 px-5 py-3 text-center text-sm font-semibold text-foreground shadow-xl"
          >
            <span className="inline-flex flex-wrap items-center justify-center gap-1">
              <Flame className="size-4 shrink-0 text-fiesta-gold" aria-hidden />
              {localStrikeToast}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {sillyPop ? (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              initial={reduceMotion ? { opacity: 0 } : { scale: 0.35, rotate: -10 }}
              animate={reduceMotion ? { opacity: 1 } : { scale: 1, rotate: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 440, damping: 16 }}
              className="rounded-2xl border-2 border-fiesta-gold/55 bg-fiesta-crimson/95 px-6 py-4 text-center text-xl font-bold tracking-tight text-foreground shadow-2xl sm:text-2xl"
            >
              {sillyPop}
            </motion.span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {partnerToast ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed bottom-6 left-1/2 z-50 max-w-[min(92vw,28rem)] -translate-x-1/2 rounded-full border border-fiesta-gold/35 bg-fiesta-crimson/90 px-5 py-2 text-center text-sm font-medium text-foreground shadow-lg"
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
              Palabra Vortex — 2–3 players
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
                Play together
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Same Spanish prompt for everyone — English answers stay short (1–3 words). New rooms get a 6-character
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
              <CardDescription>
                12 rondas picantes · 45s cada una · poné un apodo divertido abajo · inglés cortito (1–3 palabras) como siempre.
              </CardDescription>
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

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => {
                  const p = profiles.get(m.user_id);
                  const cc = m.country_code ?? countryCode;
                  const isMe = m.user_id === userId;
                  return (
                    <div
                      key={m.user_id}
                      className="flex flex-col gap-3 rounded-xl border border-fiesta-gold/15 bg-fiesta-crimson/10 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-fiesta-crimson/25 text-2xl">
                          {p?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                          ) : (
                            (p?.username ?? "?").slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {displayName(m.user_id)}{" "}
                            <Heart className="inline size-3.5 text-fiesta-gold/80" aria-hidden />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {flagEmoji(cc)}{" "}
                            {m.user_id === room.host_id ? "Host · " : ""}
                            {countryLabel(cc)}
                          </p>
                          <p className="text-xs text-fiesta-gold">{m.ready ? "Ready ✓" : "Not ready"}</p>
                        </div>
                      </div>
                      {isMe ? (
                        <div className="space-y-2 border-t border-fiesta-gold/10 pt-3">
                          <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            Match nickname (shown in-game)
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <input
                              value={nicknameDraft}
                              onChange={(e) => {
                                nickTouchedRef.current = true;
                                setNicknameDraft(e.target.value);
                              }}
                              placeholder="e.g. UK Duende King"
                              maxLength={40}
                              className="min-w-[12rem] flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={nickBusy}
                              onClick={() => void saveMatchNickname()}
                            >
                              Save
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Defaults to your username; only lasts for this room until you change it.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {members.length < MP_MIN_PLAYERS ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Waiting for more players (need at least {MP_MIN_PLAYERS}; room holds up to {MP_MAX_PLAYERS})…
                    share the link or code.
                  </p>
                ) : members.length < MP_MAX_PLAYERS ? (
                  <p className="col-span-full text-sm text-muted-foreground">
                    Third seat is optional — you can start with {members.length} when everyone taps Ready, or wait for one
                    more.
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
                      members.length < MP_MIN_PLAYERS ||
                      members.length > MP_MAX_PLAYERS ||
                      !members.every((m) => m.ready)
                    }
                    onClick={() => void startGameAsHost()}
                  >
                    <Zap className="size-4" />
                    Start game
                  </Button>
                ) : (
                  <p className="self-center text-sm text-muted-foreground">
                    Host starts when everyone in the room is Ready ({MP_MIN_PLAYERS}–{MP_MAX_PLAYERS} players).
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Quick flirts &amp; burns:</span>
                {LOBBY_QUICK_REACTIONS.map((pr) => (
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

      {screen === "playing" && current && userId ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-orange/40 bg-fiesta-crimson/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-fiesta-gold">
              <Sparkles className="size-3.5" />
              Grammar Gladiators — Monster Arena
            </div>
            <p className="text-sm font-medium text-fiesta-gold/95">
              <Flame className="mr-1 inline size-4 align-text-bottom text-fiesta-orange" aria-hidden />
              {scoreTaunt}
            </p>
            <p className="text-xs text-muted-foreground">
              KO at 0 HP · or highest score after {totalRoundsRef.current} rounds · Skip cooldown {MP_SKIP_COOLDOWN_MS / 1000}s
            </p>
          </div>

          {(() => {
            const leftId = userId as string;
            const selfMember = members.find((x) => x.user_id === leftId);
            const rivals = members
              .filter((m) => m.user_id !== leftId)
              .sort((a, b) => a.user_id.localeCompare(b.user_id));
            const hpL = monsterHp[leftId] ?? MP_MONSTER_MAX_HP;
            const oppHps = rivals.map((m) => monsterHp[m.user_id] ?? MP_MONSTER_MAX_HP);
            const maxOppHp = oppHps.length ? Math.max(...oppHps) : hpL;
            const minOppHp = oppHps.length ? Math.min(...oppHps) : hpL;
            const bossTilt =
              oppHps.length === 0 ? 0 : hpL > maxOppHp ? -8 : hpL < minOppHp ? 8 : 0;
            const skipFlee = battleFx?.kind === "skip";

            const renderPlayerCard = (m: MemberRow, jabRotateTo: number) => {
              const glad = playerGladiatorMonster(m.user_id, gameSeed || "pre");
              const pts = scores[m.user_id] ?? 0;
              const hp = monsterHp[m.user_id] ?? MP_MONSTER_MAX_HP;
              const maxPts = Math.max(targetScoreRef.current, ...Object.values(scores), 1);
              const dmgShow =
                battleFx?.kind === "hit" && battleFx.victimId === m.user_id ? battleFx.amount : null;
              const jab = battleFx?.kind === "hit" && battleFx.attackerId === m.user_id;

              return (
                <Card
                  key={m.user_id}
                  className={cn(
                    "relative overflow-hidden border-fiesta-gold/20",
                    m.user_id === userId ? "ring-2 ring-fiesta-gold/40" : "opacity-95",
                  )}
                >
                  <motion.div
                    className="absolute inset-0 bg-fiesta-orange/0"
                    animate={
                      jab && !reduceMotion
                        ? { backgroundColor: ["rgba(251,146,60,0)", "rgba(251,146,60,0.22)", "rgba(251,146,60,0)"] }
                        : {}
                    }
                    transition={{ duration: 0.55 }}
                  />
                  <AnimatePresence>
                    {dmgShow != null ? (
                      <motion.div
                        key={`dmg-${dmgShow}-${roundIndex}`}
                        initial={{ opacity: 0, y: 8, scale: 0.7 }}
                        animate={{ opacity: 1, y: -28, scale: 1.15 }}
                        exit={{ opacity: 0, y: -48 }}
                        transition={{ duration: 0.85, ease: "easeOut" }}
                        className="pointer-events-none absolute top-10 right-3 z-20 font-[family-name:var(--font-heading)] text-2xl font-black text-fiesta-orange drop-shadow-md"
                      >
                        −{dmgShow}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <motion.span
                        animate={
                          jab && !reduceMotion
                            ? { scale: [1, 1.18, 1], rotate: [0, jabRotateTo, 0] }
                            : { scale: 1 }
                        }
                        transition={{ duration: 0.45 }}
                        className="text-4xl"
                      >
                        {glad.emoji}
                      </motion.span>
                      <span className="min-w-0">
                        {displayName(m.user_id)}{m.user_id === userId ? " (you)" : ""}
                        <span className="ml-1 inline text-lg">{flagEmoji(m.country_code ?? countryCode)}</span>
                      </span>
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground">{glad.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>Monster HP</span>
                        <span className="font-mono text-foreground">
                          {hp}/{MP_MONSTER_MAX_HP}
                        </span>
                      </div>
                      <MonsterHpBar hp={hp} maxHp={MP_MONSTER_MAX_HP} />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>Score</span>
                        <span className="font-mono text-fiesta-gold">{pts}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full bg-linear-to-r from-fiesta-crimson to-fiesta-gold"
                          initial={false}
                          animate={{ width: `${Math.min(100, (pts / maxPts) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            };

            return (
              <div className="grid items-start gap-3 lg:grid-cols-[1fr_minmax(17rem,1.35fr)_1fr]">
                <div className="order-2 space-y-3 lg:order-1">
                  {selfMember ? renderPlayerCard(selfMember, -6) : null}
                </div>

                <Card className="relative order-1 overflow-hidden border-2 border-fiesta-orange/35 bg-linear-to-b from-card to-fiesta-crimson/15 shadow-xl shadow-fiesta-gold/10 lg:order-2">
                  <FieryBurst trigger={strikeBurst} intensity="mega" />
                  <FieryBurst trigger={rageBurst} intensity="normal" className="opacity-80" />
                  <CardHeader className="relative z-[1] space-y-2 pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-fiesta-crimson/25 px-2 py-1 text-xs font-bold text-fiesta-gold">
                        Round {roundIndex + 1}/{totalRoundsRef.current}
                      </span>
                      <ItemBadge type={current.itemType} />
                      <span className="font-mono text-lg font-bold text-fiesta-orange">{secLeft}s</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-fiesta-orange/90">
                        Round boss
                      </p>
                      <motion.div
                        animate={
                          reduceMotion
                            ? {}
                            : skipFlee
                              ? { x: 96, opacity: 0.35, rotate: 14, scale: 0.88 }
                              : { rotate: bossTilt, scale: [1, 1.04, 1] }
                        }
                        transition={
                          skipFlee
                            ? { duration: 0.65, ease: "easeInOut" }
                            : { rotate: { duration: 0.5 }, scale: { duration: 2.2, repeat: Infinity, repeatType: "reverse" } }
                        }
                        className="mx-auto flex max-w-[14rem] flex-col items-center py-2"
                      >
                        <span className="select-none text-7xl sm:text-8xl" aria-hidden>
                          {roundBoss.emoji}
                        </span>
                        <p className="font-[family-name:var(--font-heading)] text-lg font-bold text-foreground">
                          {roundBoss.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{roundBoss.subtitle}</p>
                      </motion.div>
                      <AnimatePresence>
                        {skipFlee ? (
                          <motion.p
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-2 text-sm font-semibold text-fiesta-orange"
                          >
                            💨 The boss laughs as someone chickens out…
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-[1] space-y-4">
                    <p className="font-[family-name:var(--font-heading)] text-center text-2xl font-bold text-foreground sm:text-3xl">
                      {current.es}
                    </p>
                    <p className="text-center text-xs text-muted-foreground">Spanish → English (1–3 words)</p>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className={cn(
                          "min-h-12 border-2 border-amber-500/55 bg-amber-500/10 font-bold",
                          !rageUsedMap[userId] && "hover:bg-amber-500/20",
                        )}
                        disabled={Boolean(rageUsedMap[userId]) || inputLockedPlaying}
                        onClick={() => {
                          if (!userId || rageUsedMap[userId]) return;
                          sendPayload({ t: "duende_rage", roundIndex, userId });
                        }}
                      >
                        <Zap className="mr-2 size-5 text-amber-400" />
                        Duende Rage (2× strike pts)
                        {rageUsedMap[userId] ? " — used" : ""}
                      </Button>
                      <Button
                        type="button"
                        size="lg"
                        variant="secondary"
                        className={cn(
                          "min-h-12 gap-2 border-2 border-violet-400/40 bg-violet-500/15 font-bold",
                          (!skipEnabled || inputLockedPlaying) && "opacity-50",
                        )}
                        disabled={!skipEnabled || inputLockedPlaying}
                        onClick={() => {
                          if (!userId || !skipEnabled || inputLockedPlaying) return;
                          const at = Date.now();
                          skipCooldownUntilByUserRef.current[userId] = at + MP_SKIP_COOLDOWN_MS;
                          sendPayload({ t: "skip_request", roundIndex, userId, at });
                        }}
                      >
                        <FastForward className="size-5" />
                        Skip round
                      </Button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground">
                      Rage: once per match · Skip cooldown: {Math.ceil(skipCooldownLeftMs / 1000)}s
                    </p>

                    <AnimatePresence>
                      {hintVisible && !inputLockedPlaying ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.35 }}
                          className="rounded-xl border border-fiesta-gold/35 bg-fiesta-crimson/20 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-fiesta-gold">
                            Duende Hint ✨
                          </p>
                          <p className="mt-2 font-[family-name:var(--font-heading)] text-lg font-semibold sm:text-xl">
                            <HintMaskedEnglish text={current.en} seed={hintSeed} />
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">English hint with hidden letters.</p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <form onSubmit={onSubmitAnswer} className="flex flex-col gap-3 sm:flex-row">
                      <input
                        ref={gameAnswerInputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={inputLockedPlaying}
                        placeholder={mpAnswerPlaceholder}
                        className="flex-1 rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                        autoComplete="off"
                      />
                      <Button type="submit" disabled={inputLockedPlaying}>
                        Strike!
                      </Button>
                    </form>
                    <AnimatePresence>
                      {localCorrectFlash ? (
                        <motion.p
                          key="correct-flash"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-center text-lg font-bold text-emerald-400"
                        >
                          ¡Correcto!
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                    {waitingForPartnerSync ? (
                      <p className="text-center text-xs text-muted-foreground">Waiting for other players…</p>
                    ) : null}
                    {roundMsg ? <p className="text-center text-sm text-fiesta-gold">{roundMsg}</p> : null}
                    <AnimatePresence>
                      {correctReveal && correctReveal.roundIndex === roundIndex ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.28 }}
                          className="mt-2 rounded-xl border border-fiesta-gold/35 bg-fiesta-crimson/15 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-fiesta-gold">
                            {correctReveal.who === "you" ? "¡Duende strike!" : "Opponent nailed it!"}
                          </p>
                          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground sm:text-xl">
                            {correctReveal.english}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Spanish: {correctReveal.spanish}
                          </p>
                          {correctReveal.alternatives && correctReveal.alternatives.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Also accepted: {correctReveal.alternatives.join(", ")}
                            </p>
                          )}
                          {(correctReveal.itemType === "idiom" ||
                            correctReveal.itemType === "collocation" ||
                            correctReveal.itemType === "phrase") && (
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {correctReveal.hint}
                            </p>
                          )}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                    <AnimatePresence>
                      {failedReveal && failedReveal.roundIndex === roundIndex ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.28 }}
                          className="mt-2 rounded-xl border border-fiesta-orange/40 bg-fiesta-orange/10 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-fiesta-orange">The answer was:</p>
                          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground sm:text-xl">
                            {failedReveal.english}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">Spanish: {failedReveal.spanish}</p>
                          {failedReveal.alternatives && failedReveal.alternatives.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Also accepted: {failedReveal.alternatives.join(", ")}
                            </p>
                          )}
                          {(failedReveal.itemType === "idiom" ||
                            failedReveal.itemType === "collocation" ||
                            failedReveal.itemType === "phrase") && (
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{failedReveal.hint}</p>
                          )}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </CardContent>
                  <CardFooter className="relative z-[1] flex flex-col gap-3 border-t border-border/60">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Emote barrage
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {IN_GAME_EMOJI_PRESETS.map((pr) => (
                        <Button
                          key={pr}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 min-w-9 rounded-full px-2 text-base"
                          onClick={() => userId && sendPayload({ t: "reaction", userId, preset: pr })}
                        >
                          {pr}
                        </Button>
                      ))}
                    </div>
                  </CardFooter>
                </Card>

                <div className="order-3 space-y-3 lg:order-3">
                  {rivals.map((m, i) => renderPlayerCard(m, i % 2 === 0 ? 6 : -6))}
                </div>
              </div>
            );
          })()}

          <Card className="border-fiesta-gold/20 bg-fiesta-crimson/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Live emote trail</CardTitle>
              <CardDescription className="text-xs">Trash talk synced over the same Realtime channel.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-40 space-y-2 overflow-y-auto text-xs sm:max-h-48">
              {reactionLog.length === 0 ? (
                <p className="text-muted-foreground">No emotes yet — start the chaos 💋</p>
              ) : (
                reactionLog.map((row, i) => (
                  <div
                    key={`${row.at}-${i}`}
                    className="rounded-lg border border-fiesta-gold/10 bg-background/60 px-2 py-1.5"
                  >
                    <span className="font-semibold text-fiesta-gold">{displayName(row.userId)}</span>{" "}
                    <span className="text-foreground">{row.preset}</span>
                  </div>
                ))
              )}
            </CardContent>
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
              {userId && winnerId === userId ? (
                <p className="text-xl font-bold tracking-tight text-fiesta-gold sm:text-2xl">
                  ¡Campeón del Amor! 💘✨
                </p>
              ) : (
                <CardDescription>
                  {winnerId ? `${displayName(winnerId)} takes the crown — rematch for revenge? 😈` : "Scores are in."}
                </CardDescription>
              )}
              <CardDescription>Twelve rounds of words, phrases &amp; idioms — squad mode.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryKoWinnerId ? (
                <p className="rounded-xl border border-fiesta-orange/35 bg-fiesta-orange/10 px-3 py-2 text-sm font-medium text-fiesta-orange">
                  Monster KO 💀 {displayName(summaryKoWinnerId)} had the last beast standing — arena closed.
                </p>
              ) : null}
              <ul className="space-y-2 text-sm">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex flex-wrap justify-between gap-4 rounded-lg bg-muted/40 px-3 py-2"
                  >
                    <span className="flex items-center gap-2">
                      {displayName(m.user_id)} {flagEmoji(m.country_code ?? countryCode)}
                    </span>
                    <span className="flex flex-col items-end gap-0.5 text-right">
                      <span className="font-mono font-bold text-fiesta-gold">{scores[m.user_id] ?? 0} pts</span>
                      <span className="text-[10px] text-muted-foreground">
                        Final monster HP: {monsterHp[m.user_id] ?? 0}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl border border-fiesta-gold/20 bg-fiesta-crimson/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-fiesta-gold">
                  <Heart className="size-4" /> Final duende stats
                </p>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">Fastest Duende: </span>
                    {fastestDuendeUid
                      ? `${displayName(fastestDuendeUid)} — ${((fastestByUser[fastestDuendeUid] ?? 0) / 1000).toFixed(2)}s best strike`
                      : "Too close to call — you’re all terrifying 🔥"}
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Most Hints Needed: </span>
                    {hintLeaderUid
                      ? `${displayName(hintLeaderUid)} (${hintsByUser[hintLeaderUid] ?? 0} hints peeked)`
                      : "Nobody peeked — show-offs 😏"}
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Idiom Slayer: </span>
                    {idiomSlayerUid
                      ? `${displayName(idiomSlayerUid)} (${idiomStrikesByUser[idiomSlayerUid] ?? 0} idiom strikes)`
                      : "Draw on idioms — go again with more drama"}
                  </li>
                  <li className="text-xs">
                    Your fastest:{" "}
                    {(fastestMs ?? 999) < 900
                      ? `${((fastestMs as number) / 1000).toFixed(2)}s`
                      : "—"}{" "}
                    · Your idiom wins logged: {idiomHits}
                  </li>
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
