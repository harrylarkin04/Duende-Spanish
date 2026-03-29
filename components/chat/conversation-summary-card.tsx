"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Globe2, Sparkles, Wand2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DuendeLoading } from "@/components/ui/duende-loading";
import { duendeEaseOutExpo } from "@/lib/design-system";
import type { ConversationSummary } from "@/lib/ai";

type ConversationSummaryCardProps = {
  summary: ConversationSummary | null;
  loading: boolean;
  onDismiss?: () => void;
};

export function ConversationSummaryCard({
  summary,
  loading,
  onDismiss,
}: ConversationSummaryCardProps) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  if (!loading && !summary) return null;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.4, ease: duendeEaseOutExpo }}
      className="mt-6"
    >
      <Card className="overflow-hidden border-fiesta-gold/30 bg-linear-to-br from-fiesta-crimson/15 via-card/95 to-card/80 shadow-xl shadow-fiesta-crimson/10">
        <CardHeader className="relative">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-fiesta-gold/10 blur-2xl" />
          <div className="relative flex items-center gap-2 text-fiesta-gold">
            <Sparkles className="size-5" />
            <CardTitle className="font-[family-name:var(--font-heading)] text-xl">
              Resumen de la charla
            </CardTitle>
          </div>
          <CardDescription>
            Gramática, palabras para el bolsillo y un toque cultural — como si tu amigo te dejara notas.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-5">
          {loading && (
            <DuendeLoading
              compact
              className="!flex-row !py-6"
              label="Generando resumen de la charla"
            />
          )}
          {summary && !loading && (
            <>
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Wand2 className="size-4 text-fiesta-orange" />
                  Gramática
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {summary.grammarNotes.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpen className="size-4 text-fiesta-gold" />
                  Vocabulario guardado
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.vocabulary.map((w) => (
                    <span
                      key={w}
                      className="rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-2.5 py-0.5 text-xs font-medium text-fiesta-gold"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Globe2 className="size-4 text-fiesta-orange" />
                  Cultura
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {summary.culturalTips.map((line, i) => (
                    <li key={i} className="rounded-lg bg-muted/30 px-2 py-1.5">
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
              <p className="rounded-xl border border-fiesta-gold/25 bg-background/50 p-3 text-sm font-medium leading-relaxed text-foreground">
                {summary.encouragement}
              </p>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-md text-xs text-muted-foreground underline-offset-4 hover:text-fiesta-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/45"
                >
                  Cerrar resumen
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
