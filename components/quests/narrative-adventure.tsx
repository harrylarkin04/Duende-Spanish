"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MapPin, RotateCcw, Sparkles } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUENOS_AIRES_START,
  getQuestNode,
  type QuestNode,
} from "@/lib/quests/buenos-aires-story";
import { cn } from "@/lib/utils";

const endingStyles = {
  gold: "border-fiesta-gold/40 bg-linear-to-br from-fiesta-gold/15 via-card to-fiesta-orange/10",
  crimson:
    "border-fiesta-crimson/35 bg-linear-to-br from-fiesta-crimson/15 via-card to-background",
  sky: "border-sky-500/30 bg-linear-to-br from-sky-500/10 via-card to-fiesta-crimson/5",
} as const;

export function NarrativeAdventure() {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;
  const [nodeId, setNodeId] = React.useState(BUENOS_AIRES_START);
  const node = getQuestNode(nodeId);

  const restart = () => setNodeId(BUENOS_AIRES_START);

  if (!node) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        Escena no encontrada.
        <Button type="button" className="mt-4" onClick={restart}>
          Reiniciar
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <MapPin className="size-3.5" />
          Aventura narrativa
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Buenos Aires: tu primer día
          </span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:mx-0">
          Elegí en español. Cada decisión abre un camino distinto — mates, tango,
          pizza o callejones con lección incluida.
        </p>
      </motion.header>

      <SceneCard
        key={nodeId}
        node={node}
        reduce={reduce}
        onChoose={(next) => setNodeId(next)}
        onRestart={restart}
      />
    </div>
  );
}

function SceneCard({
  node,
  reduce,
  onChoose,
  onRestart,
}: {
  node: QuestNode;
  reduce: boolean;
  onChoose: (next: string) => void;
  onRestart: () => void;
}) {
  const isEnding = Boolean(node.ending);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card
        className={cn(
          "overflow-hidden border-fiesta-gold/20 bg-card/85 shadow-lg backdrop-blur-sm",
          isEnding && node.ending && endingStyles[node.ending.variant],
        )}
      >
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl">
              {isEnding && node.ending ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="size-5 shrink-0 text-fiesta-gold" />
                  {node.ending.title}
                </span>
              ) : (
                <>Capítulo en curso</>
              )}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1 border-fiesta-gold/25"
              onClick={onRestart}
            >
              <RotateCcw className="size-3.5" />
              Reiniciar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isEnding && node.ending ? (
            <p className="text-base leading-relaxed text-foreground sm:text-lg">
              {node.ending.epitaph}
            </p>
          ) : (
            <p className="whitespace-pre-line text-base leading-relaxed text-foreground sm:text-lg">
              {node.narrative}
            </p>
          )}
        </CardContent>
        {!isEnding && node.choices && node.choices.length > 0 && (
          <CardFooter className="flex flex-col gap-2 border-t border-border/40 bg-muted/20 pt-4">
            <p className="mb-1 w-full text-center text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-left">
              ¿Qué hacés?
            </p>
            <div className="flex w-full flex-col gap-2">
              {node.choices.map((c, i) => (
                <motion.div
                  key={`${c.next}-${i}`}
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.25 }}
                >
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-auto min-h-11 w-full whitespace-normal px-4 py-3 text-left text-sm leading-snug shadow-sm hover:border-fiesta-gold/30 hover:bg-fiesta-crimson/10"
                    onClick={() => onChoose(c.next)}
                  >
                    {c.text}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardFooter>
        )}
        {isEnding && (
          <CardFooter className="border-t border-border/40 bg-muted/15 pt-4">
            <Button
              type="button"
              className="w-full gap-2 shadow-md shadow-fiesta-crimson/15"
              onClick={onRestart}
            >
              <RotateCcw className="size-4" />
              Jugar otra vez (otros caminos)
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
