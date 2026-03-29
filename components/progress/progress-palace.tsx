"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Crown, Sparkles, Sprout } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { ActivityHeatmap } from "@/components/progress/activity-heatmap";
import { FluencyCharts } from "@/components/progress/fluency-charts";
import { SkillTreeVisual } from "@/components/progress/skill-tree-visual";
import { StatsDetailCards } from "@/components/progress/stats-detail-cards";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getChatProgress } from "@/lib/progress/chat-stats-local";
import { computeProgressModel, type ProgressModel } from "@/lib/progress/compute-progress";
import { getLocalLeaderboard } from "@/lib/games/palabra-vortex/leaderboard-local";
import { reviewDeckCount } from "@/lib/games/palabra-vortex/review-deck";

const SSR_CHAT_SNAPSHOT = {
  userMessagesTotal: 0,
  assistantMessagesTotal: 0,
  voiceTurns: 0,
  lastAt: null as string | null,
};

function loadModel(): ProgressModel {
  return computeProgressModel(
    getLocalLeaderboard(),
    reviewDeckCount(),
    getChatProgress(),
  );
}

export function ProgressPalace() {
  const reduce = useReducedMotion() === true;
  const [tick, setTick] = React.useState(0);
  const [model, setModel] = React.useState<ProgressModel>(() =>
    computeProgressModel([], 0, SSR_CHAT_SNAPSHOT),
  );

  React.useEffect(() => {
    setModel(loadModel());
  }, [tick]);

  React.useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key?.includes("duende.palabra") ||
        e.key?.includes("duende.progress.chat")
      ) {
        bump();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const isColdStart =
    model.totals.palabraRuns === 0 &&
    model.chat.userMessagesTotal === 0 &&
    model.chat.voiceTurns === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Crown className="size-3.5" />
          Progress Palace
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Tu trono de fluidez
          </span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mx-0">
          Cada partida y cada charla dejan huella aquí. Explora el árbol, el
          calor de tus días y las gráficas que celebran tu constancia.
        </p>
      </motion.header>

      {isColdStart && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <EmptyState
            icon={Sprout}
            title="Tu palacio espera datos"
            description="Jugá una partida de Palabra Vortex o charlá con un compañero: el mapa, el árbol y las gráficas cobran vida con tu práctica en este dispositivo."
          >
            <Link
              href="/games/palabra-vortex"
              className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
            >
              Ir a Palabra Vortex
            </Link>
            <Link href="/chat" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Abrir chat
            </Link>
          </EmptyState>
        </motion.div>
      )}

      <FluencyCharts model={model} />

      <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-start">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45 }}
        >
          <Card className="border-fiesta-gold/20 bg-card/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <SkillTreeVisual
                branches={model.skillBranches}
                fluency={model.fluency}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          <Card className="border-fiesta-gold/20 bg-card/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <ActivityHeatmap
                levels={model.heatmapLevels}
                max={model.heatmapMax}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-8 flex items-start gap-3 rounded-2xl border border-fiesta-orange/25 bg-fiesta-orange/5 p-4 text-sm text-muted-foreground"
      >
        <Sparkles className="mt-0.5 size-5 shrink-0 text-fiesta-gold" />
        <p>
          <span className="font-medium text-foreground">Tip del Duende:</span>{" "}
          combina el Daily de Palabra con cinco minutos de chat: el mapa se
          enciende y la previsión sube más rápido que con la teoría sola.
        </p>
      </motion.div>

      <StatsDetailCards model={model} className="mt-10" />
    </div>
  );
}
