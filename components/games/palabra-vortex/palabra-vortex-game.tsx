"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Flame,
  Lightbulb,
  Share2,
  Sparkles,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import type { PalabraVocabResult } from "@/app/(protected)/actions/record-game";
import { recordPalabraRun } from "@/app/(protected)/actions/record-game";
import { FieryBurst } from "@/components/games/palabra-vortex/fiery-burst";
import { VictoryConfetti } from "@/components/games/palabra-vortex/victory-confetti";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  checkTranslation,
  dailySeedDate,
  scoreForCorrect,
  shuffleRandom,
  shuffleSeeded,
} from "@/lib/games/palabra-vortex/game-utils";
import {
  getBestForDifficulty,
  getBestForMode,
  getLocalLeaderboard,
  recordLocalScore,
} from "@/lib/games/palabra-vortex/leaderboard-local";
import { playPalabraSound } from "@/lib/games/palabra-vortex/sound-placeholders";
import type {
  GameModeKind,
  PalabraDifficultyLevel,
  PalabraEntry,
  PalabraItemType,
  TranslationDirection,
} from "@/lib/games/palabra-vortex/types";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  VOCABULARY_WORD_COUNT,
  palabraPoolForDifficulty,
} from "@/lib/words";
import { cn } from "@/lib/utils";
import { reviewDeckCount, saveMissedToReviewDeck } from "@/lib/games/palabra-vortex/review-deck";
import { useRealtimeProfileGameSync } from "@/hooks/use-supabase-game-sync";

type Phase = "menu" | "playing" | "summary";

type RunBreakdown = Record<PalabraItemType, number>;

const EMPTY_BREAKDOWN: RunBreakdown = { word: 0, phrase: 0, idiom: 0, collocation: 0 };

const TYPE_BADGES: Record<
  PalabraItemType,
  { label: string; className: string }
> = {
  word: {
    label: "Word",
    className: "border-sky-400/45 bg-sky-500/10 text-sky-100",
  },
  phrase: {
    label: "Phrase",
    className: "border-violet-400/45 bg-violet-500/12 text-violet-100",
  },
  collocation: {
    label: "Collocation",
    className: "border-emerald-400/45 bg-emerald-500/12 text-emerald-100",
  },
  idiom: {
    label: "Idiom",
    className: "border-amber-400/50 bg-amber-500/12 text-amber-100",
  },
};

function ItemTypeBadge({ type }: { type?: PalabraItemType }) {
  if (!type) return null;
  const b = TYPE_BADGES[type];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        b.className,
      )}
    >
      {b.label}
    </span>
  );
}

function formatBreakdownLine(b: RunBreakdown): string {
  const bits: string[] = [];
  if (b.word) bits.push(`${b.word} word${b.word === 1 ? "" : "s"}`);
  if (b.phrase) bits.push(`${b.phrase} phrase${b.phrase === 1 ? "" : "s"}`);
  if (b.collocation) bits.push(`${b.collocation} collocation${b.collocation === 1 ? "" : "s"}`);
  if (b.idiom) bits.push(`${b.idiom} idiom${b.idiom === 1 ? "" : "s"}`);
  return bits.length ? `You nailed ${bits.join(", ")} this run.` : "";
}

const DEFAULT_BESTS: Record<PalabraDifficultyLevel, number> = {
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0,
};

const MODE_TIMER: Record<GameModeKind, number | null> = {
  sprint: 60,
  endless: null,
  daily: 90,
};

const MODE_HINTS: Record<GameModeKind, number> = {
  sprint: 3,
  endless: 3,
  daily: 2,
};

const DAILY_WORDS = 20;

type PalabraVortexGameProps = {
  initialDifficultyBests?: Record<PalabraDifficultyLevel, number>;
};

export function PalabraVortexGame({ initialDifficultyBests }: PalabraVortexGameProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  useRealtimeProfileGameSync(() => router.refresh());
  const inputRef = React.useRef<HTMLInputElement>(null);
  const difficultyRef = React.useRef<PalabraDifficultyLevel>("easy");
  const vocabRoundRef = React.useRef<PalabraVocabResult[]>([]);

  const [phase, setPhase] = React.useState<Phase>("menu");
  const [mode, setMode] = React.useState<GameModeKind>("sprint");
  const [direction, setDirection] = React.useState<TranslationDirection>("es-en");
  const [difficulty, setDifficulty] = React.useState<PalabraDifficultyLevel>("easy");
  const [difficultyBests, setDifficultyBests] = React.useState<Record<PalabraDifficultyLevel, number>>(
    () => initialDifficultyBests ?? { ...DEFAULT_BESTS },
  );
  const [celebrateRecord, setCelebrateRecord] = React.useState(false);

  const [queue, setQueue] = React.useState<PalabraEntry[]>([]);
  const [index, setIndex] = React.useState(0);
  const [input, setInput] = React.useState("");
  const [score, setScore] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [bestStreak, setBestStreak] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);
  const [wrongCount, setWrongCount] = React.useState(0);

  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);
  const [hintsLeft, setHintsLeft] = React.useState(0);
  const [showHint, setShowHint] = React.useState(false);

  const [feedback, setFeedback] = React.useState<"correct" | "wrong" | null>(null);
  const [shakeKey, setShakeKey] = React.useState(0);
  const [burstKey, setBurstKey] = React.useState(0);
  const [summaryBurstKey, setSummaryBurstKey] = React.useState(0);

  const [summaryReason, setSummaryReason] = React.useState<"time" | "complete" | "quit" | null>(null);
  const [reviewSize, setReviewSize] = React.useState(0);
  const [runBreakdown, setRunBreakdown] = React.useState<RunBreakdown>(EMPTY_BREAKDOWN);

  const scoreRef = React.useRef(0);
  const bestStreakRef = React.useRef(0);
  const correctCountRef = React.useRef(0);
  const wrongCountRef = React.useRef(0);

  React.useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  React.useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  React.useEffect(() => {
    bestStreakRef.current = bestStreak;
  }, [bestStreak]);
  React.useEffect(() => {
    correctCountRef.current = correctCount;
  }, [correctCount]);
  React.useEffect(() => {
    wrongCountRef.current = wrongCount;
  }, [wrongCount]);

  const current = queue[index];

  React.useEffect(() => {
    setReviewSize(reviewDeckCount());
  }, [phase]);

  React.useEffect(() => {
    if (initialDifficultyBests) setDifficultyBests(initialDifficultyBests);
  }, [initialDifficultyBests]);

  const timerActive = phase === "playing" && timeLeft != null && timeLeft > 0;

  const endGame = React.useCallback((reason: "time" | "complete" | "quit") => {
    setCelebrateRecord(false);
    setPhase("summary");
    setSummaryReason(reason);
    setFeedback(null);
    playPalabraSound(reason === "quit" ? "whoosh" : "gameOver");

    const diff = difficultyRef.current;
    const vocabResults = [...vocabRoundRef.current];
    vocabRoundRef.current = [];

    recordLocalScore(mode, scoreRef.current, bestStreakRef.current, diff);

    const total = correctCountRef.current + wrongCountRef.current;
    if (total > 0 && reason !== "quit") {
      void recordPalabraRun({
        score: scoreRef.current,
        gameMode: mode,
        difficulty: diff,
        correctCount: correctCountRef.current,
        totalQuestions: total,
        vocabResults,
      }).then((res) => {
        if (res.ok) {
          setDifficultyBests(res.bestsByDifficulty);
          if (res.newPersonalBest) {
            setCelebrateRecord(true);
            setSummaryBurstKey((k) => k + 1);
            playPalabraSound("powerup");
          }
        }
      });
    }
  }, [mode]);

  React.useEffect(() => {
    if (!timerActive) return;
    const id = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s === null || s <= 0) return s;
        const next = s - 1;
        if (next === 0) {
          window.setTimeout(() => endGame("time"), 0);
        }
        if (next > 0 && next <= 10) playPalabraSound("tick");
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive, endGame]);

  const buildQueue = React.useCallback((m: GameModeKind, tier: PalabraDifficultyLevel) => {
    const pool = palabraPoolForDifficulty(tier);
    if (m === "daily") {
      const seed = `palabra-daily-${dailySeedDate()}-${tier}`;
      return shuffleSeeded([...pool], seed).slice(0, Math.min(DAILY_WORDS, pool.length));
    }
    return shuffleRandom([...pool]);
  }, []);

  const startGame = (m: GameModeKind) => {
    setMode(m);
    const q = buildQueue(m, difficultyRef.current);
    setQueue(q);
    setIndex(0);
    setInput("");
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    vocabRoundRef.current = [];
    setCelebrateRecord(false);
    setTimeLeft(MODE_TIMER[m]);
    setHintsLeft(MODE_HINTS[m]);
    setShowHint(false);
    setFeedback(null);
    setSummaryReason(null);
    setRunBreakdown(EMPTY_BREAKDOWN);
    setPhase("playing");
    playPalabraSound("whoosh");
    window.setTimeout(() => inputRef.current?.focus(), 100);
  };

  const goMenuFromSummary = () => {
    setPhase("menu");
    setQueue([]);
    setIndex(0);
    setTimeLeft(null);
    setCelebrateRecord(false);
  };

  const advanceAfterRound = React.useCallback(
    (idxNow: number, qLen: number) => {
      setFeedback(null);
      setInput("");
      setShowHint(false);
      if (mode === "daily" && idxNow >= qLen - 1) {
        endGame("complete");
        return;
      }
      if (idxNow + 1 >= qLen) {
        setQueue(shuffleRandom([...palabraPoolForDifficulty(difficultyRef.current)]));
        setIndex(0);
      } else {
        setIndex(idxNow + 1);
      }
      window.setTimeout(() => inputRef.current?.focus(), 50);
    },
    [mode, endGame],
  );

  const submitAnswer = React.useCallback(() => {
    if (!current || phase !== "playing") return;
    const ok = checkTranslation(input, current, direction);
    const idxNow = index;
    const qLen = queue.length;

    vocabRoundRef.current.push({
      spanish: current.es,
      english: current.en,
      correct: ok,
    });

    if (ok) {
      setFeedback("correct");
      playPalabraSound("correct");
      const nextStreak = streak + 1;
      const pts = scoreForCorrect(nextStreak);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setScore((s) => s + pts);
      setCorrectCount((c) => c + 1);
      setBurstKey((k) => k + 1);
      const it: PalabraItemType = current.itemType ?? "word";
      setRunBreakdown((b) => ({ ...b, [it]: b[it] + 1 }));
      window.setTimeout(() => advanceAfterRound(idxNow, qLen), 980);
    } else {
      setFeedback("wrong");
      playPalabraSound("wrong");
      saveMissedToReviewDeck(current.id);
      setReviewSize(reviewDeckCount());
      setStreak(0);
      setWrongCount((w) => w + 1);
      setShakeKey((k) => k + 1);
      window.setTimeout(() => advanceAfterRound(idxNow, qLen), 1280);
    }
  }, [
    current,
    phase,
    input,
    direction,
    streak,
    index,
    queue.length,
    advanceAfterRound,
  ]);

  const useDuendeHint = () => {
    if (hintsLeft <= 0 || !current) return;
    setHintsLeft((h) => h - 1);
    setShowHint(true);
    playPalabraSound("powerup");
  };

  const shareResults = async () => {
    const tier = DIFFICULTY_LABELS[difficulty];
    const line = `🔥 Palabra Vortex — ${tier.title} (${tier.cefr}) · ${mode.toUpperCase()} · Score ${score} · Racha ${bestStreak} · ${correctCount} aciertos · Duende`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Palabra Vortex", text: line });
        return;
      }
    } catch {
      /* dismissed */
    }
    try {
      await navigator.clipboard.writeText(line);
    } catch {
      /* ignore */
    }
  };

  const promptLabel =
    direction === "es-en" ? "Translate to English" : "Translate to Spanish";

  const promptText =
    current && direction === "es-en" ? current.es : current ? current.en : "";

  const leaderboard = getLocalLeaderboard().slice(0, 5);
  const bestSprint = getBestForMode("sprint");
  const bestDaily = getBestForMode("daily");
  const bestEndless = getBestForMode("endless");
  const tierLocalBest = getBestForDifficulty(difficulty);

  return (
    <div className="relative mx-auto min-h-dvh max-w-2xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <VictoryConfetti active={celebrateRecord && phase === "summary"} />

      {phase === "playing" && (
        <div className="mb-6 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => endGame("quit")}>
            End run
          </Button>
        </div>
      )}

      <div className="mb-8 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold"
        >
          <Zap className="size-3.5 text-fiesta-orange" />
          Palabra Vortex
        </motion.div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Ride the word spiral
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {VOCABULARY_WORD_COUNT}+ ítems mezclados (palabras, frases, colocaciones, modismos) — respuestas en inglés de 1–3 palabras.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden border-fiesta-gold/25 bg-card/70 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-2">
                <CardTitle className="font-[family-name:var(--font-heading)]">Dificultad</CardTitle>
                <CardDescription>
                  Cada nivel mezcla tipos de ítem; en partida también entran ítems del nivel inferior para fluidez.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DifficultySegments value={difficulty} onChange={setDifficulty} reduced={Boolean(reduce)} />
                <p className="text-xs text-muted-foreground">
                  {DIFFICULTY_LABELS[difficulty].blurb}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Tu mejor (local) en este nivel</span>
                  <span className="font-mono font-semibold text-fiesta-gold">
                    {tierLocalBest ? `${tierLocalBest.score} pts` : "—"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fiesta-gold/20 bg-fiesta-crimson/5 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">Récord en la nube (este nivel)</span>
                  <span className="font-mono font-semibold text-foreground">
                    {difficultyBests[difficulty] > 0 ? `${difficultyBests[difficulty]} pts` : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-fiesta-gold/20 bg-card/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)]">Choose mode</CardTitle>
                <CardDescription>Timer pressure, endless flow, or today&apos;s shared deck.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <ModeButton
                  icon={<Timer className="size-5" />}
                  title="Sprint"
                  desc="60 seconds — max score."
                  active={mode === "sprint"}
                  onClick={() => setMode("sprint")}
                />
                <ModeButton
                  icon={<Flame className="size-5" />}
                  title="Endless"
                  desc="No clock — pure streak."
                  active={mode === "endless"}
                  onClick={() => setMode("endless")}
                />
                <ModeButton
                  icon={<Trophy className="size-5" />}
                  title="Daily"
                  desc={`${DAILY_WORDS} words · 90s · seed ${dailySeedDate()}`}
                  active={mode === "daily"}
                  onClick={() => setMode("daily")}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4 border-t border-border/60 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-xs font-medium text-muted-foreground">Direction</span>
                  <div className="flex rounded-lg border border-border bg-background/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => setDirection("es-en")}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        direction === "es-en"
                          ? "bg-fiesta-crimson text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Spanish → English
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("en-es")}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        direction === "en-es"
                          ? "bg-fiesta-crimson text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      English → Spanish
                    </button>
                  </div>
                </div>
                <Button size="lg" className="w-full shadow-lg shadow-fiesta-crimson/20 sm:w-auto" onClick={() => startGame(mode)}>
                  <Sparkles data-icon="inline-start" className="size-4" />
                  Start {mode === "sprint" ? "Sprint" : mode === "endless" ? "Endless" : "Daily"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-4 text-fiesta-gold" />
                  Leaderboard
                </CardTitle>
                <CardDescription>Historial local — los récords por nivel también viven en Supabase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 rounded-lg border border-border/50 bg-muted/20 p-3 font-mono text-xs sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Sprint best</p>
                    <p className="font-semibold text-foreground">{bestSprint?.score ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily best</p>
                    <p className="font-semibold text-foreground">{bestDaily?.score ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Endless best</p>
                    <p className="font-semibold text-foreground">{bestEndless?.score ?? "—"}</p>
                  </div>
                </div>
                {leaderboard.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Play a run to populate your hall of fame.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {leaderboard.map((row, i) => (
                      <li
                        key={`${row.at}-${i}`}
                        className="flex justify-between gap-2 border-b border-border/40 py-1.5 last:border-0"
                      >
                        <span className="text-muted-foreground">
                          <span className="capitalize">{row.mode}</span>
                          {row.difficulty ? (
                            <span className="text-fiesta-orange"> · {row.difficulty}</span>
                          ) : null}
                        </span>
                        <span className="tabular-nums text-foreground">
                          {row.score} pts · streak {row.bestStreak}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground">
              Review deck: <span className="font-mono text-fiesta-gold">{reviewSize}</span> words saved from misses
            </p>
          </motion.div>
        )}

        {phase === "playing" && current && (
          <motion.div
            key="play"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full border border-[#c60b1e]/40 bg-linear-to-r from-[#c60b1e]/20 via-[#ffc400]/15 to-[#aa151b]/20 px-3 py-1 text-xs font-semibold text-foreground">
                  {DIFFICULTY_LABELS[difficulty].title} · {DIFFICULTY_LABELS[difficulty].cefr}
                </span>
                <span className="rounded-full bg-muted/60 px-3 py-1 font-mono tabular-nums text-foreground">
                  {score} pts
                </span>
                <span className="flex items-center gap-1 rounded-full border border-fiesta-orange/30 bg-fiesta-crimson/10 px-3 py-1 font-medium text-fiesta-gold">
                  <Flame className="size-3.5" />
                  {streak}
                </span>
                <span className="rounded-full px-3 py-1 text-muted-foreground">
                  ✓ {correctCount} · ✗ {wrongCount}
                </span>
              </div>
              {timeLeft !== null && (
                <motion.span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono tabular-nums",
                    timeLeft <= 10
                      ? "border-fiesta-crimson/60 bg-fiesta-crimson/15 text-fiesta-gold"
                      : "border-border bg-card/80 text-foreground",
                  )}
                  animate={timeLeft <= 10 && !reduce ? { scale: [1, 1.04, 1] } : undefined}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Timer className="size-3.5" />
                  {timeLeft}s
                </motion.span>
              )}
            </div>

            <div className="relative">
              <FieryBurst trigger={burstKey} />
              <motion.div
                key={shakeKey}
                animate={
                  reduce || shakeKey === 0
                    ? undefined
                    : { x: [0, -10, 10, -8, 8, -4, 4, 0] }
                }
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                <Card className="relative overflow-hidden border-fiesta-gold/25 bg-card/80 shadow-xl backdrop-blur-md">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-fiesta-orange">{promptLabel}</p>
                      <ItemTypeBadge type={current.itemType} />
                      {current.topic ? (
                        <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                          {current.topic}
                        </span>
                      ) : null}
                    </div>
                    <CardTitle className="font-[family-name:var(--font-heading)] text-2xl leading-snug sm:text-3xl">
                      {promptText}
                    </CardTitle>
                    {current.dialect && current.dialect !== "neutral" && (
                      <CardDescription className="text-xs text-muted-foreground">{current.dialect}</CardDescription>
                    )}
                    {mode === "daily" && (
                      <CardDescription>
                        Word {index + 1} / {queue.length}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="sr-only" htmlFor="pv-input">
                      {promptLabel}
                    </label>
                    <input
                      id="pv-input"
                      ref={inputRef}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitAnswer();
                        }
                      }}
                      disabled={feedback !== null}
                      className="w-full rounded-xl border border-input bg-background/90 px-4 py-3.5 text-base text-foreground shadow-inner outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:border-fiesta-gold/50 focus-visible:ring-2 focus-visible:ring-fiesta-gold/30 disabled:opacity-60"
                      placeholder={direction === "es-en" ? "Type English…" : "Escribe en español…"}
                    />

                    <AnimatePresence>
                      {feedback !== null && (
                        <motion.div
                          key={feedback}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={cn(
                            "rounded-xl border p-4 text-sm",
                            feedback === "correct"
                              ? "border-fiesta-gold/35 bg-fiesta-crimson/15"
                              : "border-fiesta-orange/40 bg-fiesta-orange/10",
                          )}
                        >
                          {feedback === "correct" ? (
                            <>
                              <p className="font-semibold text-fiesta-gold">Correct — nice.</p>
                              <p className="mt-1 text-base font-medium text-foreground">
                                {direction === "es-en" ? `English: ${current.en}` : `Spanish: ${current.es}`}
                              </p>
                              {(current.itemType === "idiom" || current.itemType === "collocation") && (
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{current.hint}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-fiesta-orange">Almost — here&apos;s the answer.</p>
                              <p className="mt-1 text-base font-semibold text-foreground">
                                {direction === "es-en" ? current.en : current.es}
                              </p>
                              {direction === "es-en" && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  Tip: articles like &quot;the&quot; or &quot;of&quot; are optional if your core words match.
                                </p>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-xl border border-fiesta-gold/25 bg-fiesta-crimson/10 p-4 text-sm"
                        >
                          <p className="font-medium text-fiesta-gold">Duende Hint</p>
                          <p className="mt-2 text-foreground/90">{current.hint}</p>
                          {current.example && (
                            <p className="mt-2 border-t border-fiesta-gold/20 pt-2 text-muted-foreground italic">
                              {current.example}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={submitAnswer}
                        disabled={feedback !== null || !input.trim()}
                      >
                        Lock in
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex-1 gap-2 border border-fiesta-gold/20 bg-secondary/80"
                        onClick={useDuendeHint}
                        disabled={hintsLeft <= 0 || feedback !== null}
                      >
                        <Lightbulb className="size-4 text-fiesta-gold" />
                        Duende Hint ({hintsLeft})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div
              className="min-h-[1.25rem] text-center text-xs font-medium text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {feedback === "correct" && <span>Spiral stays hot — siguiente…</span>}
              {feedback === "wrong" && <span>Guardado en repaso — siguiente…</span>}
            </div>
          </motion.div>
        )}

        {phase === "summary" && (
          <motion.div
            key="sum"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="relative">
              <FieryBurst trigger={summaryBurstKey} intensity="mega" className="opacity-90" />
              <Card className="relative z-[1] border-fiesta-gold/30 bg-linear-to-br from-fiesta-crimson/15 to-card/90">
                <CardHeader>
                  {celebrateRecord && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-2 inline-flex w-fit rounded-full border border-[#ffc400]/50 bg-linear-to-r from-[#c60b1e]/30 via-[#ffc400]/25 to-[#aa151b]/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-fiesta-gold"
                    >
                      ¡Nuevo récord personal!
                    </motion.p>
                  )}
                  <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">
                    Run complete
                  </CardTitle>
                  <CardDescription>
                    {DIFFICULTY_LABELS[difficulty].title} ({DIFFICULTY_LABELS[difficulty].cefr}) ·{" "}
                    {summaryReason === "time" && "Time is a cruel maestro."}
                    {summaryReason === "complete" && "Daily deck devoured."}
                    {summaryReason === "quit" && "You stepped off the spiral."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Score" value={String(score)} />
                    <Stat label="Best streak" value={String(bestStreak)} />
                    <Stat label="Correct" value={String(correctCount)} />
                    <Stat label="Misses" value={String(wrongCount)} />
                  </div>

                  {correctCount > 0 && formatBreakdownLine(runBreakdown) && (
                    <div className="rounded-xl border border-fiesta-gold/25 bg-fiesta-crimson/10 p-4">
                      <p className="font-medium text-foreground">{formatBreakdownLine(runBreakdown)}</p>
                      {Object.values(runBreakdown).filter((n) => n > 0).length >= 2 && correctCount >= 4 && (
                        <p className="mt-2 text-sm font-semibold text-fiesta-gold">
                          Great mix of words and expressions — keep crossing categories!
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Récords por dificultad (nube)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {DIFFICULTY_ORDER.map((d) => (
                        <div
                          key={d}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                            d === difficulty
                              ? "border-[#ffc400]/40 bg-[#c60b1e]/10"
                              : "border-border/50 bg-background/40",
                          )}
                        >
                          <span className="text-muted-foreground">
                            {DIFFICULTY_LABELS[d].title}{" "}
                            <span className="text-[10px]">({DIFFICULTY_LABELS[d].cefr})</span>
                          </span>
                          <span className="font-mono font-semibold tabular-nums text-foreground">
                            {difficultyBests[d] > 0 ? `${difficultyBests[d]} pts` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-[1] flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="w-full gap-2 sm:flex-1" onClick={shareResults}>
                    <Share2 className="size-4" />
                    Share results
                  </Button>
                  <Button type="button" className="w-full sm:flex-1" onClick={() => startGame(mode)}>
                    Again
                  </Button>
                  <Button type="button" variant="secondary" className="w-full sm:flex-1" onClick={goMenuFromSummary}>
                    Menu
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DifficultySegments({
  value,
  onChange,
  reduced,
}: {
  value: PalabraDifficultyLevel;
  onChange: (d: PalabraDifficultyLevel) => void;
  reduced: boolean;
}) {
  return (
    <div
      className="rounded-2xl bg-linear-to-r from-[#c60b1e] via-[#ffc400] to-[#aa151b] p-[3px] shadow-lg shadow-[#c60b1e]/20"
      role="tablist"
      aria-label="Nivel de dificultad"
    >
      <div className="grid grid-cols-2 gap-1 rounded-[13px] bg-background/95 p-1 sm:grid-cols-4">
        {DIFFICULTY_ORDER.map((d) => {
          const active = value === d;
          const meta = DIFFICULTY_LABELS[d];
          return (
            <motion.button
              key={d}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(d)}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              className={cn(
                "relative rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:px-3",
                active
                  ? "bg-linear-to-b from-[#c60b1e]/90 via-[#ffc400]/85 to-[#aa151b]/90 text-white shadow-md"
                  : "bg-muted/40 text-foreground hover:bg-muted/70",
              )}
            >
              <span className="block leading-tight">{meta.title}</span>
              <span className={cn("mt-0.5 block text-[10px] font-normal", active ? "text-white/90" : "text-muted-foreground")}>
                {meta.cefr}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ModeButton({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-fiesta-gold/50 bg-fiesta-crimson/20 shadow-md shadow-fiesta-crimson/10"
          : "border-border/60 bg-card/50 hover:border-fiesta-gold/25",
      )}
    >
      <div className="flex items-center gap-2 text-fiesta-gold">{icon}</div>
      <p className="mt-2 font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </motion.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-heading)] text-xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
