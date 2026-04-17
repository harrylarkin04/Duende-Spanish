"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Sparkles, Wind } from "lucide-react";
import * as React from "react";

import { VictoryConfetti } from "@/components/games/palabra-vortex/victory-confetti";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { POO_FEAST_FOODS } from "@/lib/games/poo-feast/foods";
import type { PooFeastLocale } from "@/lib/games/poo-feast/messages";
import { pooFeastMessages } from "@/lib/games/poo-feast/messages";
import { computeSmellScore, type SmellResult } from "@/lib/games/poo-feast/scoring";
import type { FoodCategory, GamePhase } from "@/lib/games/poo-feast/types";
import { cn } from "@/lib/utils";

const PICK_COUNT = 3;
const DIGEST_MS = 4200;

function foodLabel(locale: PooFeastLocale, id: string): string {
  const labels = pooFeastMessages[locale].foodLabels as Record<string, string>;
  return labels[id] ?? id;
}

export function PooFeastGame(): React.ReactElement {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  const [locale, setLocale] = React.useState<PooFeastLocale>("es");
  const m = pooFeastMessages[locale];

  const [phase, setPhase] = React.useState<GamePhase>("intro");
  const [p1, setP1] = React.useState<string[]>([]);
  const [p2, setP2] = React.useState<string[]>([]);
  const [r1, setR1] = React.useState<SmellResult | null>(null);
  const [r2, setR2] = React.useState<SmellResult | null>(null);
  const [digestLine, setDigestLine] = React.useState(0);

  const reset = React.useCallback(() => {
    setPhase("intro");
    setP1([]);
    setP2([]);
    setR1(null);
    setR2(null);
    setDigestLine(0);
  }, []);

  const startDuel = React.useCallback(() => {
    setP1([]);
    setP2([]);
    setR1(null);
    setR2(null);
    setDigestLine(0);
    setPhase("pick_p1");
  }, []);

  const togglePick = React.useCallback((player: 1 | 2, id: string) => {
    const setSel = player === 1 ? setP1 : setP2;
    setSel((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= PICK_COUNT) return prev;
      return [...prev, id];
    });
  }, []);

  const confirmP1 = React.useCallback(() => {
    if (p1.length !== PICK_COUNT) return;
    setPhase("pick_p2");
  }, [p1.length]);

  const confirmP2 = React.useCallback(() => {
    if (p2.length !== PICK_COUNT) return;
    setR1(computeSmellScore(p1));
    setR2(computeSmellScore(p2));
    setDigestLine(0);
    setPhase("digest");
  }, [p1, p2]);

  React.useEffect(() => {
    if (phase !== "digest") return;
    const id = window.setInterval(() => {
      setDigestLine((i) => (i + 1) % m.digestHints.length);
    }, 900);
    return () => window.clearInterval(id);
  }, [phase, m.digestHints.length]);

  React.useEffect(() => {
    if (phase !== "digest") return;
    const t = window.setTimeout(() => setPhase("reveal"), DIGEST_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  const skipDigest = React.useCallback(() => {
    if (phase === "digest") setPhase("reveal");
  }, [phase]);

  const goResults = React.useCallback(() => {
    if (phase === "reveal") setPhase("results");
  }, [phase]);

  const maxAroma = React.useMemo(() => {
    if (r1 == null || r2 == null) return 1;
    return Math.max(r1.total, r2.total, 1);
  }, [r1, r2]);

  const outcome = React.useMemo(() => {
    if (r1 == null || r2 == null) return null;
    if (r1.total === r2.total) return "tie" as const;
    return r1.total > r2.total ? (1 as const) : (2 as const);
  }, [r1, r2]);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <VictoryConfetti active={phase === "results" && outcome !== null && outcome !== "tie"} />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
            <Wind className="size-3.5" aria-hidden />
            Multijugador local
          </div>
          <div className="flex gap-1 rounded-full border border-border/60 bg-card/40 p-0.5 text-xs">
            <button
              type="button"
              className={cn(
                "rounded-full px-2 py-1 transition-colors",
                locale === "es"
                  ? "bg-fiesta-crimson/30 text-fiesta-gold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setLocale("es")}
            >
              ES
            </button>
            <button
              type="button"
              className={cn(
                "rounded-full px-2 py-1 transition-colors",
                locale === "en"
                  ? "bg-fiesta-crimson/30 text-fiesta-gold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setLocale("en")}
            >
              EN
            </button>
          </div>
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            {m.title}
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{m.subtitle}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
          >
            <Card className="border-fiesta-gold/20 bg-card/60">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)] flex items-center gap-2 text-xl">
                  <Sparkles className="size-5 text-fiesta-gold" aria-hidden />
                  {m.title}
                </CardTitle>
                <CardDescription>{m.subtitle}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button type="button" size="lg" className="bg-fiesta-crimson text-white hover:bg-fiesta-crimson/90" onClick={startDuel}>
                  {m.start}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(phase === "pick_p1" || phase === "pick_p2") && (
          <motion.div
            key={phase}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
          >
            <PickPanel
              reduce={reduce}
              locale={locale}
              categoryLabels={m.categoryLabels}
              activePlayer={phase === "pick_p1" ? 1 : 2}
              selection={phase === "pick_p1" ? p1 : p2}
              onToggle={(id) => togglePick(phase === "pick_p1" ? 1 : 2, id)}
              onConfirm={phase === "pick_p1" ? confirmP1 : confirmP2}
              confirmDisabled={
                phase === "pick_p1" ? p1.length !== PICK_COUNT : p2.length !== PICK_COUNT
              }
              picksLabel={m.picksLabel(phase === "pick_p1" ? p1.length : p2.length, PICK_COUNT)}
              prompt={m.pickPrompt(phase === "pick_p1" ? m.player1 : m.player2, PICK_COUNT)}
              passHint={phase === "pick_p2" ? m.passDevice : null}
              confirmLabel={phase === "pick_p1" ? m.nextPlayer : m.revealBattle}
            />
          </motion.div>
        )}

        {phase === "digest" && (
          <motion.div
            key="digest"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.32 }}
          >
            <Card className="overflow-hidden border-fiesta-orange/25 bg-linear-to-br from-fiesta-crimson/20 via-card/80 to-fiesta-gold/10">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">{m.digestTitle}</CardTitle>
                <CardDescription className="min-h-[3rem] text-base text-foreground/90">
                  {m.digestHints[digestLine]}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-background/60"
                  role="status"
                  aria-live="polite"
                  aria-label={m.digestTitle}
                >
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson"
                    initial={{ width: "2%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: DIGEST_MS / 1000, ease: "easeInOut" }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={skipDigest}>
                    {m.flushCta}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "reveal" && r1 != null && r2 != null && (
          <motion.div
            key="reveal"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <Card className="border-fiesta-gold/25 bg-card/70">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)] flex items-center gap-2">
                  <Wind className="size-5 text-fiesta-orange" aria-hidden />
                  {m.aromaIndex}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AromaCompare
                  reduce={reduce}
                  name1={m.player1}
                  name2={m.player2}
                  r1={r1}
                  r2={r2}
                  max={maxAroma}
                  baseLine={m.baseLine}
                  bonusWord={m.bonusWord}
                />
                <Button type="button" size="lg" className="w-full sm:w-auto" onClick={goResults}>
                  {m.seeWinner}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "results" && r1 != null && r2 != null && outcome != null && (
          <motion.div
            key="results"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.38 }}
          >
            <Card className="border-fiesta-gold/30 bg-card/80 shadow-xl shadow-fiesta-gold/10">
              <CardHeader className="text-center sm:text-left">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-fiesta-crimson/25 text-fiesta-gold sm:mx-0">
                  <Crown className="size-7" aria-hidden />
                </div>
                <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">
                  {outcome === "tie"
                    ? m.tie
                    : m.winner(outcome === 1 ? m.player1 : m.player2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <ScoreBreakdown
                    locale={locale}
                    title={m.player1}
                    result={r1}
                    highlight={outcome === 1}
                    baseLineLabel={m.baseLine}
                  />
                  <ScoreBreakdown
                    locale={locale}
                    title={m.player2}
                    result={r2}
                    highlight={outcome === 2}
                    baseLineLabel={m.baseLine}
                  />
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="w-full bg-fiesta-crimson text-white hover:bg-fiesta-crimson/90 sm:w-auto"
                  onClick={reset}
                >
                  {m.playAgain}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type PickPanelProps = {
  reduce: boolean;
  locale: PooFeastLocale;
  categoryLabels: Record<FoodCategory, string>;
  activePlayer: 1 | 2;
  selection: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  picksLabel: string;
  prompt: string;
  passHint: string | null;
  confirmLabel: string;
};

function PickPanel(props: PickPanelProps): React.ReactElement {
  const {
    reduce,
    locale,
    categoryLabels,
    activePlayer,
    selection,
    onToggle,
    onConfirm,
    confirmDisabled,
    picksLabel,
    prompt,
    passHint,
    confirmLabel,
  } = props;

  const ring =
    activePlayer === 1 ? "ring-fiesta-crimson/55 shadow-[0_0_22px_rgba(159,18,57,0.35)]" : "ring-fiesta-gold/45 shadow-[0_0_22px_rgba(251,191,36,0.2)]";

  return (
    <Card className={cn("border-fiesta-gold/15 bg-card/60 ring-2 transition-shadow", ring)}>
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-xl">{prompt}</CardTitle>
        <CardDescription>{picksLabel}</CardDescription>
        {passHint != null && (
          <p className="mt-2 rounded-lg border border-dashed border-fiesta-orange/30 bg-fiesta-orange/5 px-3 py-2 text-sm text-foreground/90">
            {passHint}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {POO_FEAST_FOODS.map((f, i) => {
            const on = selection.includes(f.id);
            const disabled = !on && selection.length >= PICK_COUNT;
            return (
              <motion.li
                key={f.id}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.02 }}
              >
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={on}
                  aria-label={`${foodLabel(locale, f.id)}${on ? ", seleccionado" : ", no seleccionado"}`}
                  onClick={() => onToggle(f.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                    on
                      ? "border-fiesta-gold/60 bg-fiesta-gold/15 text-foreground"
                      : "border-border/70 bg-background/40 hover:border-fiesta-gold/35 hover:bg-muted/50",
                    disabled && "cursor-not-allowed opacity-50 hover:border-border/70",
                  )}
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {f.emoji}
                  </span>
                  <span className="font-medium leading-tight">{foodLabel(locale, f.id)}</span>
                  <span className="text-[0.7rem] text-muted-foreground">
                    +{f.smellBase} · {categoryLabels[f.category]}
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
        <Button
          type="button"
          size="lg"
          disabled={confirmDisabled}
          className="w-full bg-fiesta-crimson text-white hover:bg-fiesta-crimson/90 sm:w-auto"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

type AromaCompareProps = {
  reduce: boolean;
  name1: string;
  name2: string;
  r1: SmellResult;
  r2: SmellResult;
  max: number;
  baseLine: string;
  bonusWord: string;
};

function AromaCompare(props: AromaCompareProps): React.ReactElement {
  const { reduce, name1, name2, r1, r2, max, baseLine, bonusWord } = props;
  const pct1 = Math.round((r1.total / max) * 100);
  const pct2 = Math.round((r2.total / max) * 100);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-fiesta-crimson/95">{name1}</span>
          <span className="tabular-nums text-fiesta-gold">{r1.total}</span>
        </div>
        <Meter valuePct={pct1} reduce={reduce} gradient="from-fiesta-crimson to-fiesta-orange" />
        <p className="text-xs text-muted-foreground">
          {baseLine}: {r1.baseSum}
          {r1.lines.length > 0 && (
            <>
              {" · "}
              {bonusWord}: +{r1.total - r1.baseSum}
            </>
          )}
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-fiesta-gold">{name2}</span>
          <span className="tabular-nums text-fiesta-gold">{r2.total}</span>
        </div>
        <Meter valuePct={pct2} reduce={reduce} gradient="from-fiesta-gold to-fiesta-orange" />
        <p className="text-xs text-muted-foreground">
          {baseLine}: {r2.baseSum}
          {r2.lines.length > 0 && (
            <>
              {" · "}
              {bonusWord}: +{r2.total - r2.baseSum}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Meter(props: {
  valuePct: number;
  reduce: boolean;
  gradient: string;
}): React.ReactElement {
  const { valuePct, reduce, gradient } = props;
  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-muted/80">
      <motion.div
        className={cn("h-full rounded-full bg-linear-to-r", gradient)}
        initial={reduce ? { width: `${valuePct}%` } : { width: "0%" }}
        animate={{ width: `${valuePct}%` }}
        transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
      />
    </div>
  );
}

function ScoreBreakdown(props: {
  locale: PooFeastLocale;
  title: string;
  result: SmellResult;
  highlight: boolean;
  baseLineLabel: string;
}): React.ReactElement {
  const { locale, title, result, highlight, baseLineLabel } = props;
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight ? "border-fiesta-gold/55 bg-fiesta-gold/10" : "border-border/60 bg-background/40",
      )}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-fiesta-gold">{result.total}</p>
      <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <li>
          {baseLineLabel}: <span className="text-foreground">{result.baseSum}</span>
        </li>
        {result.lines.map((line) => (
          <li key={line.labelEs} className="flex justify-between gap-2">
            <span className="text-foreground/90">
              {locale === "es" ? line.labelEs : line.labelEn}
            </span>
            <span className="tabular-nums text-fiesta-orange">+{line.points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
