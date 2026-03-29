"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Headphones, Lightbulb, Rabbit, RotateCcw, Sparkles, Trophy, Volume2 } from "lucide-react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { recordListeningDuel } from "@/app/(protected)/actions/record-listening-duel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildListeningDeck, LISTENING_DUEL_ROUNDS } from "@/lib/games/listening-duel/deck";
import { matchesListeningType } from "@/lib/games/listening-duel/match-type";
import type { ShuffledListeningRound } from "@/lib/games/listening-duel/types";
import { LISTENING_TOPIC_LABELS, type ListeningTopicId } from "@/lib/games/listening-duel/types";
import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/words";
import { cn } from "@/lib/utils";
import { useRealtimeProfileGameSync } from "@/hooks/use-supabase-game-sync";

import { ListeningWaveform } from "./listening-waveform";
import { VinylPlatter } from "./vinyl-platter";

const ANSWER_MS = 18_000;
const SLOW_USES = 2;
const HINT_USES = 2;
const SLOW_RATE = 0.68;
const NORMAL_RATE = 0.95;

type Phase = "menu" | "duel" | "summary";

function playSoftChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(523.25, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    o.start();
    o.stop(ctx.currentTime + 0.22);
    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    /* ignore */
  }
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const prefer = (c: (v: SpeechSynthesisVoice) => boolean) => voices.find(c) ?? null;
  return (
    prefer((v) => v.lang === "es-ES") ||
    prefer((v) => v.lang.startsWith("es-MX")) ||
    prefer((v) => v.lang.startsWith("es-AR")) ||
    prefer((v) => v.lang.startsWith("es")) ||
    null
  );
}

export function ListeningDuelGame() {
  const router = useRouter();
  const reduce = useReducedMotion() === true;
  useRealtimeProfileGameSync(() => router.refresh());

  const [phase, setPhase] = React.useState<Phase>("menu");
  const [difficulty, setDifficulty] = React.useState<PalabraDifficultyLevel>("easy");
  const [deck, setDeck] = React.useState<ShuffledListeningRound[]>([]);
  const [roundIndex, setRoundIndex] = React.useState(0);

  const [isListening, setIsListening] = React.useState(false);
  const [canAnswer, setCanAnswer] = React.useState(false);
  const [waveOn, setWaveOn] = React.useState(false);

  const [score, setScore] = React.useState(0);
  const [combo, setCombo] = React.useState(0);
  const [bestCombo, setBestCombo] = React.useState(0);
  const [correctCount, setCorrectCount] = React.useState(0);

  const [slowLeft, setSlowLeft] = React.useState(SLOW_USES);
  const [hintLeft, setHintLeft] = React.useState(HINT_USES);
  const [showHint, setShowHint] = React.useState(false);

  const [answerTime, setAnswerTime] = React.useState(ANSWER_MS);
  const [typeInput, setTypeInput] = React.useState("");
  const [feedback, setFeedback] = React.useState<"idle" | "ok" | "bad">("idle");

  const [struggled, setStruggled] = React.useState<ListeningTopicId[]>([]);
  const [savedOk, setSavedOk] = React.useState(false);

  const playTokenRef = React.useRef(0);
  const resolvingRef = React.useRef(false);

  const scoreRef = React.useRef(0);
  const comboRef = React.useRef(0);
  const correctRef = React.useRef(0);
  const struggledRef = React.useRef<ListeningTopicId[]>([]);

  React.useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  React.useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  React.useEffect(() => {
    correctRef.current = correctCount;
  }, [correctCount]);
  React.useEffect(() => {
    struggledRef.current = struggled;
  }, [struggled]);

  const current = deck[roundIndex];

  React.useEffect(() => {
    const warm = () => window.speechSynthesis.getVoices();
    warm();
    window.speechSynthesis.onvoiceschanged = warm;
  }, []);

  const speakLine = React.useCallback((text: string, rate: number) => {
    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES";
      u.rate = rate;
      u.pitch = 1;
      const v = pickSpanishVoice();
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  const playClip = React.useCallback(
    async (rate: number) => {
      if (!current) return;
      const my = ++playTokenRef.current;
      setIsListening(true);
      setWaveOn(true);
      playSoftChime();
      await speakLine(current.prompt.spanish, rate);
      if (playTokenRef.current !== my) return;
      setIsListening(false);
      setWaveOn(false);
    },
    [current, speakLine],
  );

  React.useEffect(() => {
    if (phase !== "duel" || !current) return;
    let cancelled = false;
    setCanAnswer(false);
    setFeedback("idle");
    setTypeInput("");
    setShowHint(false);
    setAnswerTime(ANSWER_MS);
    resolvingRef.current = false;

    void (async () => {
      await playClip(NORMAL_RATE);
      if (cancelled) return;
      setCanAnswer(true);
    })();

    return () => {
      cancelled = true;
      playTokenRef.current += 1;
      window.speechSynthesis.cancel();
      setIsListening(false);
      setWaveOn(false);
    };
  }, [phase, roundIndex, current?.prompt.id, playClip]); // eslint-disable-line react-hooks/exhaustive-deps -- clip id pins round

  React.useEffect(() => {
    if (phase !== "duel" || !canAnswer || feedback !== "idle") return;
    if (answerTime <= 0) return;
    const id = window.setInterval(() => {
      setAnswerTime((ms) => (ms <= 50 ? 0 : ms - 50));
    }, 50);
    return () => window.clearInterval(id);
  }, [phase, canAnswer, feedback, roundIndex]); // eslint-disable-line react-hooks/exhaustive-deps -- timer drives answerTime

  const markStruggle = React.useCallback((topic: ListeningTopicId) => {
    setStruggled((s) => (s.includes(topic) ? s : [...s, topic]));
  }, []);

  const goSummary = React.useCallback(async () => {
    window.speechSynthesis.cancel();
    playTokenRef.current++;
    setPhase("summary");
    const res = await recordListeningDuel({
      score: scoreRef.current,
      difficulty,
      correctCount: correctRef.current,
      totalRounds: LISTENING_DUEL_ROUNDS,
      struggledTopics: struggledRef.current,
    });
    setSavedOk(res.ok);
  }, [difficulty]);

  const advanceRound = React.useCallback(() => {
    resolvingRef.current = false;
    if (roundIndex + 1 >= LISTENING_DUEL_ROUNDS) {
      void goSummary();
    } else {
      setAnswerTime(ANSWER_MS);
      setRoundIndex((i) => i + 1);
    }
  }, [roundIndex, goSummary]);

  const resolveMc = React.useCallback(
    (idx: number) => {
      if (!current || phase !== "duel") {
        resolvingRef.current = false;
        return;
      }
      const ok = idx === current.correctIndex;
      setFeedback(ok ? "ok" : "bad");
      if (!ok) markStruggle(current.prompt.topic);
      if (ok) {
        const nc = comboRef.current + 1;
        comboRef.current = nc;
        setCombo(nc);
        setBestCombo((b) => Math.max(b, nc));
        const nCorrect = correctRef.current + 1;
        correctRef.current = nCorrect;
        setCorrectCount(nCorrect);
        const base = 125;
        const timeB = Math.round((answerTime / ANSWER_MS) * 90);
        const mult = 1 + Math.min(nc - 1, 12) * 0.09;
        setScore((s) => {
          const next = s + Math.round((base + timeB) * mult);
          scoreRef.current = next;
          return next;
        });
      } else {
        comboRef.current = 0;
        setCombo(0);
        setScore((s) => {
          const next = Math.max(0, s - 35);
          scoreRef.current = next;
          return next;
        });
      }
      window.setTimeout(advanceRound, ok ? 520 : 780);
    },
    [current, phase, answerTime, markStruggle, advanceRound],
  );

  const resolveType = React.useCallback(
    (fromTimeout: boolean) => {
      if (!current || phase !== "duel") {
        resolvingRef.current = false;
        return;
      }
      const ok = !fromTimeout && matchesListeningType(typeInput, current.prompt);
      setFeedback(ok ? "ok" : "bad");
      if (!ok) markStruggle(current.prompt.topic);
      if (ok) {
        const nc = comboRef.current + 1;
        comboRef.current = nc;
        setCombo(nc);
        setBestCombo((b) => Math.max(b, nc));
        const nCorrect = correctRef.current + 1;
        correctRef.current = nCorrect;
        setCorrectCount(nCorrect);
        const base = 150;
        const timeB = Math.round((answerTime / ANSWER_MS) * 90);
        const mult = 1 + Math.min(nc - 1, 12) * 0.09;
        setScore((s) => {
          const next = s + Math.round((base + timeB) * mult);
          scoreRef.current = next;
          return next;
        });
      } else {
        comboRef.current = 0;
        setCombo(0);
        setScore((s) => {
          const next = Math.max(0, s - 35);
          scoreRef.current = next;
          return next;
        });
      }
      window.setTimeout(advanceRound, ok ? 520 : 780);
    },
    [current, phase, typeInput, answerTime, markStruggle, advanceRound],
  );

  const resolveMcRef = React.useRef(resolveMc);
  const resolveTypeRef = React.useRef(resolveType);
  resolveMcRef.current = resolveMc;
  resolveTypeRef.current = resolveType;

  React.useEffect(() => {
    if (phase !== "duel" || answerTime !== 0 || !canAnswer || feedback !== "idle" || !current) return;
    if (resolvingRef.current) return;
    resolvingRef.current = true;
    if (current.prompt.mode === "mc") resolveMcRef.current(-1);
    else resolveTypeRef.current(true);
  }, [answerTime, phase, canAnswer, feedback, current]);

  const startDuel = React.useCallback(() => {
    const d = buildListeningDeck(difficulty);
    setDeck(d);
    setRoundIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setBestCombo(0);
    setCorrectCount(0);
    correctRef.current = 0;
    setSlowLeft(SLOW_USES);
    setHintLeft(HINT_USES);
    setShowHint(false);
    setStruggled([]);
    struggledRef.current = [];
    setSavedOk(false);
    setFeedback("idle");
    resolvingRef.current = false;
    setPhase("duel");
  }, [difficulty]);

  const replay = React.useCallback(() => {
    if (!current || isListening) return;
    void playClip(NORMAL_RATE);
  }, [current, isListening, playClip]);

  const useSlowPower = React.useCallback(() => {
    if (slowLeft <= 0 || !canAnswer || feedback !== "idle" || isListening) return;
    setSlowLeft((n) => n - 1);
    setAnswerTime((t) => Math.min(ANSWER_MS, t + 4500));
    void playClip(SLOW_RATE);
  }, [slowLeft, canAnswer, feedback, isListening, playClip]);

  const useHintPower = React.useCallback(() => {
    if (hintLeft <= 0 || !canAnswer || feedback !== "idle") return;
    setHintLeft((n) => n - 1);
    setShowHint(true);
  }, [hintLeft, canAnswer, feedback]);

  const comboMult = combo > 0 ? 1 + Math.min(combo - 1, 12) * 0.09 : 1;
  const answerPct = canAnswer && feedback === "idle" ? (answerTime / ANSWER_MS) * 100 : 0;

  return (
    <div className="relative mx-auto min-h-dvh max-w-lg px-4 pb-28 pt-6 sm:max-w-xl sm:px-6 sm:pt-10">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.12),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(99,102,241,0.1),transparent_45%),radial-gradient(ellipse_at_20%_80%,rgba(198,11,30,0.08),transparent_40%)]" />

      <header className="mb-8 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-zinc-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-200"
        >
          <Headphones className="size-3.5 text-amber-400" />
          Listening Duel
        </motion.div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold sm:text-4xl">
          <span className="bg-linear-to-r from-amber-200 via-white to-violet-300 bg-clip-text text-transparent">
            Oído de oro
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Voz del sistema (español) · ondas en vivo · combo y poderes Duende.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <Card className="border-amber-500/20 bg-zinc-950/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)]">Dificultad</CardTitle>
                <CardDescription>Frases más densas en niveles altos; mezcla de opción múltiple y dictado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl bg-linear-to-r from-amber-600/40 via-violet-600/30 to-rose-700/40 p-[3px] shadow-lg shadow-amber-900/20">
                  <div className="grid grid-cols-2 gap-1 rounded-[13px] bg-zinc-950/95 p-1 sm:grid-cols-4">
                    {DIFFICULTY_ORDER.map((d) => (
                      <motion.button
                        key={d}
                        type="button"
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        onClick={() => setDifficulty(d)}
                        className={cn(
                          "rounded-xl px-2 py-2.5 text-center text-xs font-semibold transition-colors",
                          difficulty === d
                            ? "bg-linear-to-b from-amber-500/90 via-amber-600/80 to-violet-900/90 text-white shadow-md"
                            : "bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800",
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
              <CardFooter className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-linear-to-r from-amber-500 to-rose-700 text-lg font-bold text-white shadow-lg"
                  onClick={startDuel}
                >
                  <Volume2 className="size-5" />
                  Empezar duelo ({LISTENING_DUEL_ROUNDS} clips)
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Requiere navegador con Web Speech API. Próximo paso: clips ElevenLabs en{" "}
                  <code className="rounded bg-muted px-1">/public/audio/listening/</code>.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {phase === "duel" && current && (
          <motion.div
            key="duel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="rounded-full bg-zinc-900/90 px-3 py-1 font-mono text-amber-200/90">
                Clip {roundIndex + 1}/{LISTENING_DUEL_ROUNDS}
              </span>
              <span className="rounded-full bg-zinc-900/90 px-3 py-1 font-mono text-white">
                {score} pts
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 font-bold",
                  combo >= 3 ? "bg-violet-600/40 text-violet-100" : "bg-zinc-800 text-zinc-400",
                )}
              >
                ×{comboMult.toFixed(2)} combo
              </span>
            </div>

            <Card className="overflow-hidden border-amber-500/25 bg-zinc-950/80 shadow-2xl backdrop-blur-md">
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-col items-center gap-4">
                  <VinylPlatter isPlaying={isListening || waveOn} size={200} />
                  <ListeningWaveform isActive={waveOn || isListening} className="w-full max-w-sm opacity-90" />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 border border-amber-500/30"
                    onClick={replay}
                    disabled={isListening}
                  >
                    <RotateCcw className="size-4" />
                    Repetir audio
                  </Button>
                </div>

                {canAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        className="h-full rounded-full bg-linear-to-r from-amber-400 to-violet-500"
                        animate={{ width: `${answerPct}%` }}
                        transition={{ duration: 0.05 }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1 border-violet-500/40 text-violet-200"
                        disabled={slowLeft <= 0 || feedback !== "idle" || isListening}
                        onClick={useSlowPower}
                      >
                        <Rabbit className="size-3.5" />
                        Lento ({slowLeft})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-1 border-amber-500/40 text-amber-200"
                        disabled={hintLeft <= 0 || feedback !== "idle"}
                        onClick={useHintPower}
                      >
                        <Lightbulb className="size-3.5" />
                        Pista ({hintLeft})
                      </Button>
                    </div>

                    {showHint && (
                      <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-sm text-amber-100/90">
                        Duende: {current.prompt.duendeHint}
                      </p>
                    )}

                    <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {current.prompt.mode === "mc" ? "¿Qué escuchaste?" : "Escribe lo que oíste"}
                    </p>

                    {current.prompt.mode === "mc" ? (
                      <div className="grid gap-2">
                        {current.choices.map((c, i) => (
                          <motion.button
                            key={`${c}-${i}`}
                            type="button"
                            disabled={feedback !== "idle"}
                            whileTap={reduce || feedback !== "idle" ? undefined : { scale: 0.99 }}
                            onClick={() => {
                              if (feedback !== "idle" || resolvingRef.current) return;
                              resolvingRef.current = true;
                              resolveMc(i);
                            }}
                            className={cn(
                              "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                              feedback === "idle"
                                ? "border-zinc-700 bg-zinc-900/80 hover:border-amber-500/50 hover:bg-zinc-800"
                                : "opacity-60",
                              feedback !== "idle" && i === current.correctIndex && "border-emerald-500/60 bg-emerald-950/40",
                            )}
                          >
                            {c}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          value={typeInput}
                          onChange={(e) => setTypeInput(e.target.value)}
                          disabled={feedback !== "idle"}
                          placeholder="Escribe en español…"
                          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 text-base text-white outline-none ring-offset-zinc-950 placeholder:text-zinc-600 focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/30"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && feedback === "idle" && !resolvingRef.current) {
                              resolvingRef.current = true;
                              resolveType(false);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          className="w-full"
                          disabled={feedback !== "idle" || !typeInput.trim()}
                          onClick={() => {
                            if (feedback !== "idle" || resolvingRef.current) return;
                            resolvingRef.current = true;
                            resolveType(false);
                          }}
                        >
                          Enviar
                        </Button>
                      </div>
                    )}

                    <AnimatePresence>
                      {feedback === "ok" && (
                        <motion.p
                          key="ok"
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center text-sm font-semibold text-emerald-400"
                        >
                          ¡Perfecto! Sigue el combo.
                        </motion.p>
                      )}
                      {feedback === "bad" && (
                        <motion.p
                          key="bad"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-sm text-rose-300"
                        >
                          {current.prompt.mode === "mc" ? "Casi — otra será." : `Era: «${current.prompt.spanish}»`}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "summary" && (
          <motion.div
            key="sum"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-violet-500/30 bg-zinc-950/85 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-2xl">
                  <Trophy className="size-8 text-amber-400" />
                  Duelo cerrado
                </CardTitle>
                <CardDescription>
                  Combo máximo ×{(1 + Math.min(Math.max(bestCombo - 1, 0), 12) * 0.09).toFixed(2)}
                  {savedOk ? " · Guardado en Supabase" : " · Sin guardar (revisa conexión)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <StatBox label="Puntos" value={String(score)} />
                <StatBox label="Aciertos" value={`${correctCount}/${LISTENING_DUEL_ROUNDS}`} />
                <StatBox label="Nivel" value={DIFFICULTY_LABELS[difficulty].title} />
              </CardContent>
              <CardContent className="border-t border-zinc-800 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Temas con tropiezos</p>
                <p className="mt-1 text-sm text-zinc-300">
                  {struggled.length === 0
                    ? "Ninguno — oído impecable."
                    : struggled.map((t) => LISTENING_TOPIC_LABELS[t]).join(", ")}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 sm:flex-row">
                <Button className="w-full gap-2 sm:flex-1" onClick={startDuel}>
                  <Sparkles className="size-4" />
                  Otro duelo
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

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-white">{value}</p>
    </div>
  );
}
