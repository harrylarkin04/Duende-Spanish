"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Flame, Skull, Sparkles, Swords, Timer } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { recordGrammarBattle } from "@/app/(protected)/actions/record-grammar-battle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildBattleDeck, shuffleChallengeChoices, type ShuffledRound } from "@/lib/games/grammar-gladiator/battle-deck";
import { GRAMMAR_TOPIC_LABELS, type GrammarTopicId } from "@/lib/games/grammar-gladiator/types";
import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/words";
import { cn } from "@/lib/utils";
import { useRealtimeProfileGameSync } from "@/hooks/use-supabase-game-sync";

const ROUNDS = 10;
const ROUND_MS = 14_000;
const BOSS_ROUND_MS = 11_000;
const PLAYER_HP0 = 100;
const MONSTER_HP0 = 100;

type Phase = "menu" | "battle" | "end";

type FloatingDmg = {
  id: string;
  side: "monster" | "player";
  n: number;
  crit?: boolean;
};

function damageForRound(correct: boolean, msLeft: number, maxMs: number, bossRound: boolean) {
  if (!correct) {
    return { toMonster: 0, toPlayer: bossRound ? 24 : 15 };
  }
  const ratio = Math.max(0, Math.min(1, msLeft / maxMs));
  const base = bossRound ? 20 : 14;
  const speed = Math.round(ratio * 22);
  return { toMonster: base + speed, toPlayer: 0 };
}

function scoreDelta(correct: boolean, msLeft: number, maxMs: number, bossRound: boolean) {
  if (!correct) return -55;
  const ratio = Math.max(0, Math.min(1, msLeft / maxMs));
  const base = bossRound ? 220 : 180;
  return Math.round(base + ratio * 160);
}

export function GrammarGladiatorGame() {
  const router = useRouter();
  const reduce = useReducedMotion() === true;
  useRealtimeProfileGameSync(() => router.refresh());

  const [phase, setPhase] = React.useState<Phase>("menu");
  const [difficulty, setDifficulty] = React.useState<PalabraDifficultyLevel>("easy");

  const [roundIndex, setRoundIndex] = React.useState(0);
  const [deck, setDeck] = React.useState<ShuffledRound[]>([]);
  const [playerHp, setPlayerHp] = React.useState(PLAYER_HP0);
  const [monsterHp, setMonsterHp] = React.useState(MONSTER_HP0);
  const [battleScore, setBattleScore] = React.useState(0);
  const [correctTotal, setCorrectTotal] = React.useState(0);
  const [topicsDone, setTopicsDone] = React.useState<GrammarTopicId[]>([]);

  const [timeLeft, setTimeLeft] = React.useState(ROUND_MS);
  const [feedback, setFeedback] = React.useState<"idle" | "correct" | "wrong">("idle");
  const [lastExplanation, setLastExplanation] = React.useState<string | null>(null);

  const [slashKey, setSlashKey] = React.useState(0);
  const [counterKey, setCounterKey] = React.useState(0);
  const [hitBurst, setHitBurst] = React.useState(0);
  const [floats, setFloats] = React.useState<FloatingDmg[]>([]);

  const [outcome, setOutcome] = React.useState<"win" | "lose" | null>(null);
  const [savedCloud, setSavedCloud] = React.useState(false);

  const timerRef = React.useRef<number | null>(null);
  const deadlineRef = React.useRef<number>(0);
  const resolvingRef = React.useRef(false);

  const battleScoreRef = React.useRef(0);
  const correctRef = React.useRef(0);
  const topicsRef = React.useRef<GrammarTopicId[]>([]);
  const playerHpRef = React.useRef(PLAYER_HP0);
  const monsterHpRef = React.useRef(MONSTER_HP0);

  React.useEffect(() => {
    battleScoreRef.current = battleScore;
  }, [battleScore]);
  React.useEffect(() => {
    correctRef.current = correctTotal;
  }, [correctTotal]);
  React.useEffect(() => {
    topicsRef.current = topicsDone;
  }, [topicsDone]);
  React.useEffect(() => {
    playerHpRef.current = playerHp;
  }, [playerHp]);
  React.useEffect(() => {
    monsterHpRef.current = monsterHp;
  }, [monsterHp]);

  const current = deck[roundIndex];
  const bossRound = roundIndex === ROUNDS - 1;
  const maxRoundMs = bossRound ? BOSS_ROUND_MS : ROUND_MS;

  const clearTimer = React.useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pushFloat = React.useCallback((side: FloatingDmg["side"], n: number, crit?: boolean) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setFloats((f) => [...f, { id, side, n, crit }]);
    window.setTimeout(() => {
      setFloats((f) => f.filter((x) => x.id !== id));
    }, 1100);
  }, []);

  const finishBattle = React.useCallback(
    async (win: boolean) => {
      setOutcome(win ? "win" : "lose");
      setPhase("end");
      clearTimer();
      const score = Math.max(0, battleScoreRef.current);
      const topics = [...new Set(topicsRef.current)];
      const res = await recordGrammarBattle({
        score,
        difficulty,
        correctCount: correctRef.current,
        totalRounds: ROUNDS,
        topicsPracticed: topics,
        won: win,
      });
      setSavedCloud(res.ok);
    },
    [clearTimer, difficulty],
  );

  const advanceOrEnd = React.useCallback(
    (newMonsterHp: number, newPlayerHp: number, nextRound: number) => {
      if (newMonsterHp <= 0) {
        void finishBattle(true);
        return;
      }
      if (newPlayerHp <= 0) {
        void finishBattle(false);
        return;
      }
      if (nextRound >= ROUNDS) {
        void finishBattle(false);
        return;
      }
      setFeedback("idle");
      setLastExplanation(null);
      setRoundIndex(nextRound);
    },
    [finishBattle],
  );

  const startBattle = React.useCallback(() => {
    const raw = buildBattleDeck(difficulty);
    const shuffled = raw.map((d) => shuffleChallengeChoices(d));
    setDeck(shuffled);
    setRoundIndex(0);
    setPlayerHp(PLAYER_HP0);
    setMonsterHp(MONSTER_HP0);
    playerHpRef.current = PLAYER_HP0;
    monsterHpRef.current = MONSTER_HP0;
    setBattleScore(0);
    battleScoreRef.current = 0;
    setCorrectTotal(0);
    correctRef.current = 0;
    setTopicsDone([]);
    topicsRef.current = [];
    setFeedback("idle");
    setLastExplanation(null);
    setOutcome(null);
    setSavedCloud(false);
    resolvingRef.current = false;
    setPhase("battle");
  }, [difficulty]);

  const resolveAnswer = React.useCallback(
    (choiceIndex: number) => {
      if (phase !== "battle" || !current) {
        resolvingRef.current = false;
        return;
      }
      if (feedback !== "idle") {
        resolvingRef.current = false;
        return;
      }

      clearTimer();

      const isBoss = roundIndex === ROUNDS - 1;
      const maxMs = isBoss ? BOSS_ROUND_MS : ROUND_MS;
      const msLeft = choiceIndex === -1 ? 0 : Math.max(0, deadlineRef.current - Date.now());
      const correct = choiceIndex === current.correctIndex;
      const { toMonster, toPlayer } = damageForRound(correct, msLeft, maxMs, isBoss);
      const sc = scoreDelta(correct, msLeft, maxMs, isBoss);

      const topic = current.def.topic;
      const nextTopics = topicsRef.current.includes(topic) ? topicsRef.current : [...topicsRef.current, topic];
      topicsRef.current = nextTopics;
      setTopicsDone(nextTopics);

      battleScoreRef.current = Math.max(0, battleScoreRef.current + sc);
      setBattleScore(battleScoreRef.current);

      if (correct) {
        correctRef.current += 1;
        setCorrectTotal(correctRef.current);
      }

      if (correct) {
        setFeedback("correct");
        setSlashKey((k) => k + 1);
        setHitBurst((k) => k + 1);
        pushFloat("monster", toMonster, toMonster >= 32);
      } else {
        setFeedback("wrong");
        setCounterKey((k) => k + 1);
        pushFloat("player", toPlayer);
        setLastExplanation(current.def.hintWrong);
      }

      const prevM = monsterHpRef.current;
      const prevP = playerHpRef.current;
      const newM = Math.max(0, prevM - toMonster);
      const newP = Math.max(0, prevP - toPlayer);
      monsterHpRef.current = newM;
      playerHpRef.current = newP;
      setMonsterHp(newM);
      setPlayerHp(newP);

      const delay = correct ? 900 : 1100;
      window.setTimeout(() => {
        resolvingRef.current = false;
        advanceOrEnd(newM, newP, roundIndex + 1);
      }, delay);
    },
    [
      phase,
      current,
      feedback,
      roundIndex,
      clearTimer,
      pushFloat,
      advanceOrEnd,
    ],
  );

  React.useEffect(() => {
    if (phase !== "battle" || feedback !== "idle" || !current) return;
    clearTimer();
    const limit = roundIndex === ROUNDS - 1 ? BOSS_ROUND_MS : ROUND_MS;
    deadlineRef.current = Date.now() + limit;
    setTimeLeft(limit);
    const id = window.setInterval(() => {
      const left = Math.max(0, deadlineRef.current - Date.now());
      setTimeLeft(left);
      if (left <= 0 && !resolvingRef.current) {
        resolvingRef.current = true;
        window.clearInterval(id);
        timerRef.current = null;
        resolveAnswer(-1);
      }
    }, 50);
    timerRef.current = id;
    return () => window.clearInterval(id);
  }, [phase, feedback, roundIndex, current?.def.id, clearTimer, resolveAnswer]); // eslint-disable-line react-hooks/exhaustive-deps -- `current?.def.id` tracks prompt

  const pctTime = maxRoundMs > 0 ? Math.min(100, (timeLeft / maxRoundMs) * 100) : 0;
  const timerHue = pctTime < 25 ? "text-fiesta-crimson" : pctTime < 50 ? "text-fiesta-orange" : "text-fiesta-gold";

  return (
    <div className="relative mx-auto min-h-dvh max-w-3xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(198,11,30,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(255,196,0,0.12),_transparent_50%)]" />

      <header className="mb-8 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#ffc400]/40 bg-[#c60b1e]/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ffc400]"
        >
          <Swords className="size-3.5" />
          Grammar Gladiator
        </motion.div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold sm:text-5xl">
          <span className="bg-linear-to-r from-[#ffc400] via-white to-[#c60b1e] bg-clip-text text-transparent drop-shadow-sm">
            Arena del subjuntivo
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          10 asaltos. El décimo es el jefe. Conjugá, elegí, sobreviví.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <Card className="border-[#c60b1e]/30 bg-card/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)]">Dificultad</CardTitle>
                <CardDescription>Misma escala CEFR que Palabra Vortex — el jefe escala contigo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl bg-linear-to-r from-[#c60b1e] via-[#ffc400] to-[#aa151b] p-[3px] shadow-xl shadow-[#c60b1e]/25">
                  <div className="grid grid-cols-2 gap-1 rounded-[13px] bg-background/95 p-1 sm:grid-cols-4">
                    {DIFFICULTY_ORDER.map((d) => (
                      <motion.button
                        key={d}
                        type="button"
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:px-3",
                          difficulty === d
                            ? "bg-linear-to-b from-[#c60b1e] via-[#ffc400]/90 to-[#aa151b] text-white shadow-md"
                            : "bg-muted/40 hover:bg-muted/70",
                        )}
                      >
                        {DIFFICULTY_LABELS[d].title}
                        <span className="mt-0.5 block text-[10px] font-normal opacity-90">
                          {DIFFICULTY_LABELS[d].cefr}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full gap-2 bg-linear-to-r from-[#c60b1e] to-[#aa151b] text-lg font-bold shadow-lg shadow-[#c60b1e]/30"
                  onClick={startBattle}
                >
                  <Flame className="size-5" />
                  Entrar a la arena
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {phase === "battle" && current && (
          <motion.div
            key="battle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <BattleArena
              reduce={reduce}
              roundIndex={roundIndex}
              bossRound={bossRound}
              playerHp={playerHp}
              monsterHp={monsterHp}
              slashKey={slashKey}
              counterKey={counterKey}
              hitBurst={hitBurst}
              floats={floats}
            />

            <Card className="relative overflow-hidden border-[#ffc400]/25 bg-card/90 shadow-2xl backdrop-blur-md">
              <div
                className={cn(
                  "absolute inset-x-0 top-0 h-1 bg-muted",
                  bossRound ? "bg-linear-to-r from-violet-600 via-fuchsia-500 to-[#ffc400]" : "bg-muted",
                )}
              />
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[#ffc400]">
                    Asalto {roundIndex + 1} / {ROUNDS}
                    {bossRound && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                        <Crown className="size-3" />
                        Jefe
                      </span>
                    )}
                  </p>
                  <CardTitle className="mt-1 font-[family-name:var(--font-heading)] text-lg leading-snug sm:text-xl">
                    {current.def.prompt}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {GRAMMAR_TOPIC_LABELS[current.def.topic]}
                  </CardDescription>
                </div>
                <div className={cn("flex items-center gap-1.5 font-mono text-sm tabular-nums", timerHue)}>
                  <Timer className="size-4" />
                  {(timeLeft / 1000).toFixed(1)}s
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <motion.div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      bossRound ? "bg-linear-to-r from-violet-500 to-[#ffc400]" : "bg-linear-to-r from-[#c60b1e] to-[#ffc400]",
                    )}
                    animate={{ width: `${pctTime}%` }}
                    transition={{ type: "tween", duration: 0.08 }}
                  />
                </motion.div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {current.choices.map((label, i) => (
                    <motion.button
                      key={`${current.def.id}-${i}`}
                      type="button"
                      disabled={feedback !== "idle"}
                      whileTap={reduce || feedback !== "idle" ? undefined : { scale: 0.98 }}
                      onClick={() => {
                        if (feedback !== "idle" || resolvingRef.current) return;
                        resolvingRef.current = true;
                        resolveAnswer(i);
                      }}
                      className={cn(
                        "rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
                        feedback === "idle"
                          ? "border-border/70 bg-background/80 hover:border-[#ffc400]/50 hover:bg-[#c60b1e]/10"
                          : "opacity-60",
                        feedback !== "idle" && i === current.correctIndex && "border-emerald-500/60 bg-emerald-500/15",
                        feedback === "wrong" && i !== current.correctIndex && "border-border/40",
                      )}
                    >
                      {label}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {feedback === "wrong" && lastExplanation && (
                    <motion.p
                      key="ex"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg border border-fiesta-orange/30 bg-fiesta-crimson/10 px-3 py-2 text-sm text-muted-foreground"
                    >
                      {lastExplanation}
                    </motion.p>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "end" && outcome && (
          <motion.div
            key="end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card
              className={cn(
                "border-2 bg-card/90 backdrop-blur-md",
                outcome === "win" ? "border-emerald-500/40" : "border-[#c60b1e]/40",
              )}
            >
              <CardHeader>
                <div className="flex items-center gap-2 text-2xl font-bold">
                  {outcome === "win" ? (
                    <>
                      <Sparkles className="size-8 text-[#ffc400]" />
                      Victoria
                    </>
                  ) : (
                    <>
                      <Skull className="size-8 text-[#c60b1e]" />
                      Derrota
                    </>
                  )}
                </div>
                <CardDescription>
                  {outcome === "win"
                    ? "El monstruo gramatical quedó en silencio."
                    : "El monstruo te leyó la cartilla. Volvé cuando quieras."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <EndStat label="Puntuación" value={String(battleScore)} />
                  <EndStat label="Aciertos" value={`${correctTotal}/${ROUNDS}`} />
                  <EndStat label="Nivel" value={DIFFICULTY_LABELS[difficulty].title} />
                  <EndStat label="Nube" value={savedCloud ? "Guardado" : "Local"} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Temas tocados:{" "}
                  {[...new Set(topicsDone)]
                    .map((t) => GRAMMAR_TOPIC_LABELS[t])
                    .join(", ") || "—"}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:flex-1" onClick={startBattle}>
                  Otra batalla
                </Button>
                <Button variant="secondary" className="w-full sm:flex-1" onClick={() => setPhase("menu")}>
                  Menú
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EndStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-base font-bold text-foreground">{value}</p>
    </div>
  );
}

function BattleArena({
  reduce,
  roundIndex,
  bossRound,
  playerHp,
  monsterHp,
  slashKey,
  counterKey,
  hitBurst,
  floats,
}: {
  reduce: boolean;
  roundIndex: number;
  bossRound: boolean;
  playerHp: number;
  monsterHp: number;
  slashKey: number;
  counterKey: number;
  hitBurst: number;
  floats: FloatingDmg[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#c60b1e]/35 bg-linear-to-b from-[#1a0a0c] via-card/95 to-background shadow-[0_0_60px_rgba(198,11,30,0.15)]">
      <div className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(90deg,transparent,transparent_32px,rgba(255,196,0,0.04)_32px,rgba(255,196,0,0.04)_33px)]" />

      <div className="relative grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
        <HealthBar label="Gladiador flamenco" hp={playerHp} max={PLAYER_HP0} side="player" hue="from-[#c60b1e] to-[#ffc400]" />
        <HealthBar
          label={bossRound ? "Jefe gramatical" : "Grama-ente"}
          hp={monsterHp}
          max={MONSTER_HP0}
          side="monster"
          hue={bossRound ? "from-violet-600 to-fuchsia-400" : "from-emerald-800 to-lime-400"}
        />
      </div>

      <div className="relative flex min-h-[200px] items-end justify-between px-6 pb-8 pt-4 sm:min-h-[240px] sm:px-10">
        <FlamencoFighter reduce={reduce} counterKey={counterKey} />
        <MonsterSprite reduce={reduce} bossRound={bossRound} roundIndex={roundIndex} hitBurst={hitBurst} slashKey={slashKey} />

        {slashKey > 0 && <SlashFx key={slashKey} reduce={reduce} />}
        {counterKey > 0 && <CounterFx key={counterKey} reduce={reduce} />}

        <AnimatePresence>
          {floats.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                y: f.side === "monster" ? -56 : 56,
                x: f.side === "monster" ? 20 : -20,
                scale: f.crit ? 1.25 : 1,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-none absolute text-2xl font-black tabular-nums drop-shadow-lg sm:text-3xl",
                f.side === "monster" ? "right-[28%] top-1/3 text-[#ffc400]" : "bottom-1/3 left-[26%] text-[#c60b1e]",
                f.crit && "text-white",
              )}
            >
              {f.side === "monster" ? "-" : "-"}
              {f.n}
              {f.crit && "!"}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HealthBar({
  label,
  hp,
  max,
  hue,
}: {
  label: string;
  hp: number;
  max: number;
  side: "player" | "monster";
  hue: string;
}) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono text-foreground">
          {hp}/{max}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/40">
        <motion.div
          className={cn("h-full rounded-full bg-linear-to-r shadow-[0_0_12px_rgba(255,196,0,0.35)]", hue)}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}

function FlamencoFighter({ reduce, counterKey }: { reduce: boolean; counterKey: number }) {
  return (
    <motion.div
      className="relative z-[2] flex flex-col items-center"
      animate={
        reduce
          ? undefined
          : {
              y: [0, -4, 0],
            }
      }
      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
    >
      <motion.div
        animate={counterKey > 0 && !reduce ? { x: [0, 14, -10, 6, 0], filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"] } : undefined}
        transition={{ duration: 0.45 }}
        className="relative"
      >
        <svg width="120" height="160" viewBox="0 0 120 160" className="drop-shadow-[0_8px_24px_rgba(198,11,30,0.45)]" aria-hidden>
          <ellipse cx="60" cy="28" rx="22" ry="24" fill="#fde4c8" />
          <ellipse cx="60" cy="135" rx="28" ry="8" fill="black" opacity="0.35" />
          <path d="M48 52 L72 52 L78 120 L42 120 Z" fill="#c60b1e" />
          <path d="M40 58 Q30 90 24 118 L36 122 Q42 90 52 62 Z" fill="#1a1a1a" />
          <path d="M80 58 Q90 90 96 118 L84 122 Q78 90 68 62 Z" fill="#1a1a1a" />
          <motion.path
            d="M58 60 Q20 40 8 20 Q28 48 58 70"
            fill="#ffc400"
            opacity="0.95"
            animate={reduce ? undefined : { rotate: [0, 8, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            style={{ transformOrigin: "58px 60px" }}
          />
          <circle cx="52" cy="26" r="3" fill="#1a1a1a" />
          <circle cx="68" cy="26" r="3" fill="#1a1a1a" />
        </svg>
      </motion.div>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#ffc400]/90">Tú</span>
    </motion.div>
  );
}

function MonsterSprite({
  reduce,
  bossRound,
  roundIndex,
  hitBurst,
  slashKey,
}: {
  reduce: boolean;
  bossRound: boolean;
  roundIndex: number;
  hitBurst: number;
  slashKey: number;
}) {
  return (
    <motion.div
      className="relative z-[2] flex flex-col items-center"
      animate={
        reduce
          ? undefined
          : {
              y: [0, -6, 0],
              rotate: [0, bossRound ? -3 : -2, 0],
            }
      }
      transition={{ repeat: Infinity, duration: bossRound ? 1.6 : 2.2, ease: "easeInOut" }}
    >
      <motion.div
        key={hitBurst}
        animate={
          slashKey > 0 && !reduce
            ? { x: [0, -18, 10, -6, 0], filter: ["hue-rotate(0deg)", "hue-rotate(20deg)", "hue-rotate(0deg)"] }
            : undefined
        }
        transition={{ duration: 0.5 }}
      >
        <svg width="140" height="170" viewBox="0 0 140 170" className="drop-shadow-[0_10px_32px_rgba(0,0,0,0.5)]" aria-hidden>
          <defs>
            <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={bossRound ? "#7c3aed" : "#14532d"} />
              <stop offset="100%" stopColor={bossRound ? "#f472b6" : "#84cc16"} />
            </linearGradient>
          </defs>
          <ellipse cx="70" cy="150" rx="36" ry="10" fill="black" opacity="0.4" />
          <motion.path
            d="M70 20 C110 20 130 70 130 110 C130 150 100 165 70 165 C40 165 10 150 10 110 C10 70 30 20 70 20 Z"
            fill="url(#mg)"
            animate={reduce ? undefined : { scaleY: [1, 1.03, 1], scaleX: [1, 0.98, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{ transformOrigin: "70px 90px" }}
          />
          <ellipse cx="52" cy="88" rx="10" ry="12" fill="#fef3c7" />
          <ellipse cx="88" cy="88" rx="10" ry="12" fill="#fef3c7" />
          <circle cx="52" cy="88" r="4" fill="#1a1a1a" />
          <circle cx="88" cy="88" r="4" fill="#1a1a1a" />
          <path d="M55 125 Q70 138 85 125" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" />
          <path d="M70 32 L58 8 L82 8 Z" fill={bossRound ? "#ffc400" : "#166534"} />
          <path d="M40 48 L28 22 L48 36 Z" fill={bossRound ? "#a855f7" : "#14532d"} />
          <path d="M100 48 L112 22 L92 36 Z" fill={bossRound ? "#a855f7" : "#14532d"} />
        </svg>
      </motion.div>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-emerald-200/90">
        Nv.{roundIndex + 1}
      </span>
    </motion.div>
  );
}

function SlashFx({ reduce }: { reduce: boolean }) {
  if (reduce) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.2, x: 40 }}
      animate={{ opacity: [0, 1, 0], scaleX: [0.2, 1.4, 1.8], x: [40, 120, 200] }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute bottom-1/3 left-1/2 z-[3] h-3 w-40 origin-left rounded-full bg-linear-to-r from-[#ffc400] via-white to-transparent opacity-90 shadow-[0_0_24px_#ffc400]"
      style={{ rotate: -12 }}
    />
  );
}

function CounterFx({ reduce }: { reduce: boolean }) {
  if (reduce) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: -20 }}
      animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 1.5], x: [-20, -80, -120] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="pointer-events-none absolute bottom-1/3 right-1/3 z-[3] h-24 w-24 rounded-full bg-[#c60b1e]/50 blur-md"
    />
  );
}
