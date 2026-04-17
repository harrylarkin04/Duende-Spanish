"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Crown, Sparkles, Wind } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { VictoryConfetti } from "@/components/games/palabra-vortex/victory-confetti";
import { PooFeastGrossStage } from "@/components/games/poo-feast/poo-feast-gross-stage";
import {
  PickPanelCard,
  PooFeastAromaCompare,
  PooFeastScoreBreakdown,
} from "@/components/games/poo-feast/poo-feast-shared";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { POO_FEAST_DIGEST_MS } from "@/lib/games/poo-feast/constants";
import type { PooFeastLocale } from "@/lib/games/poo-feast/messages";
import { pooFeastMessages } from "@/lib/games/poo-feast/messages";
import { computeSmellScore, type SmellResult } from "@/lib/games/poo-feast/scoring";
import type { GamePhase } from "@/lib/games/poo-feast/types";
import { cn } from "@/lib/utils";

export function PooFeastLocalGame(): React.ReactElement {
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
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  const confirmP1 = React.useCallback(() => {
    if (p1.length !== 3) return;
    setPhase("pick_p2");
  }, [p1.length]);

  const confirmP2 = React.useCallback(() => {
    if (p2.length !== 3) return;
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
    const t = window.setTimeout(() => setPhase("reveal"), POO_FEAST_DIGEST_MS);
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
            {m.localMode}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/games/poo-feast/multiplayer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-fiesta-gold/30",
              )}
            >
              {m.onlineMode}
            </Link>
            <div className="flex gap-1 rounded-full border border-border/60 bg-card/40 p-0.5 text-xs">
              <button
                type="button"
                className={
                  locale === "es"
                    ? "rounded-full bg-fiesta-crimson/30 px-2 py-1 text-fiesta-gold"
                    : "rounded-full px-2 py-1 text-muted-foreground hover:text-foreground"
                }
                onClick={() => setLocale("es")}
              >
                ES
              </button>
              <button
                type="button"
                className={
                  locale === "en"
                    ? "rounded-full bg-fiesta-crimson/30 px-2 py-1 text-fiesta-gold"
                    : "rounded-full px-2 py-1 text-muted-foreground hover:text-foreground"
                }
                onClick={() => setLocale("en")}
              >
                EN
              </button>
            </div>
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
                <Link
                  href="/games/poo-feast/multiplayer"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  {m.onlineMode}
                </Link>
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
            <PickPanelCard
              reduce={reduce}
              locale={locale}
              categoryLabels={m.categoryLabels}
              activePlayer={phase === "pick_p1" ? 1 : 2}
              selection={phase === "pick_p1" ? p1 : p2}
              onToggle={(id) => togglePick(phase === "pick_p1" ? 1 : 2, id)}
              onConfirm={phase === "pick_p1" ? confirmP1 : confirmP2}
              confirmDisabled={phase === "pick_p1" ? p1.length !== 3 : p2.length !== 3}
              picksLabel={m.picksLabel(phase === "pick_p1" ? p1.length : p2.length, 3)}
              prompt={m.pickPrompt(phase === "pick_p1" ? m.player1 : m.player2, 3)}
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
            className="space-y-4"
          >
            <PooFeastGrossStage
              stenchLevel={0.92}
              caption={m.grossCaption}
              tapHint={m.grossTapHint}
            />
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
                    transition={{ duration: POO_FEAST_DIGEST_MS / 1000, ease: "easeInOut" }}
                  />
                </div>
                <Button type="button" variant="outline" onClick={skipDigest}>
                  {m.flushCta}
                </Button>
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
                <PooFeastAromaCompare
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
                  {outcome === "tie" ? m.tie : m.winner(outcome === 1 ? m.player1 : m.player2)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <PooFeastScoreBreakdown
                    locale={locale}
                    title={m.player1}
                    result={r1}
                    highlight={outcome === 1}
                    baseLineLabel={m.baseLine}
                  />
                  <PooFeastScoreBreakdown
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
