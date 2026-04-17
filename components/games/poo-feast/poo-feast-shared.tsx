"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { POO_FEAST_FOODS } from "@/lib/games/poo-feast/foods";
import type { PooFeastLocale } from "@/lib/games/poo-feast/messages";
import { pooFeastMessages } from "@/lib/games/poo-feast/messages";
import type { SmellResult } from "@/lib/games/poo-feast/scoring";
import type { FoodCategory } from "@/lib/games/poo-feast/types";
import { cn } from "@/lib/utils";

import { POO_FEAST_PICK_COUNT } from "@/lib/games/poo-feast/constants";

export function foodLabel(locale: PooFeastLocale, id: string): string {
  const labels = pooFeastMessages[locale].foodLabels as Record<string, string>;
  return labels[id] ?? id;
}

export function PooFeastFoodGrid(props: {
  reduce: boolean;
  locale: PooFeastLocale;
  categoryLabels: Record<FoodCategory, string>;
  selection: string[];
  onToggle: (id: string) => void;
  pickCount?: number;
  disabled?: boolean;
}): React.ReactElement {
  const { reduce, locale, categoryLabels, selection, onToggle, pickCount = POO_FEAST_PICK_COUNT, disabled = false } = props;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {POO_FEAST_FOODS.map((f, i) => {
        const on = selection.includes(f.id);
        const limitReached = !on && selection.length >= pickCount;
        return (
          <motion.li
            key={f.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.02 }}
          >
            <button
              type="button"
              disabled={disabled || limitReached}
              aria-pressed={on}
              aria-label={`${foodLabel(locale, f.id)}${on ? ", seleccionado" : ", no seleccionado"}`}
              onClick={() => onToggle(f.id)}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left text-sm transition-colors",
                on
                  ? "border-fiesta-gold/60 bg-fiesta-gold/15 text-foreground"
                  : "border-border/70 bg-background/40 hover:border-fiesta-gold/35 hover:bg-muted/50",
                (disabled || limitReached) && "cursor-not-allowed opacity-50 hover:border-border/70",
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
  );
}

export function PickPanelCard(props: {
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
}): React.ReactElement {
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
    activePlayer === 1
      ? "ring-fiesta-crimson/55 shadow-[0_0_22px_rgba(159,18,57,0.35)]"
      : "ring-fiesta-gold/45 shadow-[0_0_22px_rgba(251,191,36,0.2)]";

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
        <PooFeastFoodGrid
          reduce={reduce}
          locale={locale}
          categoryLabels={categoryLabels}
          selection={selection}
          onToggle={onToggle}
        />
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

export function PooFeastAromaCompare(props: AromaCompareProps): React.ReactElement {
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
        <PooFeastMeter valuePct={pct1} reduce={reduce} gradient="from-fiesta-crimson to-fiesta-orange" />
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
        <PooFeastMeter valuePct={pct2} reduce={reduce} gradient="from-fiesta-gold to-fiesta-orange" />
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

export function PooFeastMeter(props: {
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

export function PooFeastScoreBreakdown(props: {
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
            <span className="text-foreground/90">{locale === "es" ? line.labelEs : line.labelEn}</span>
            <span className="tabular-nums text-fiesta-orange">+{line.points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
