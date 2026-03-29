"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";
import type { CompanionId, CompanionProfile } from "@/lib/ai";

type CompanionPickerProps = {
  companions: CompanionProfile[];
  value: CompanionId;
  onChange: (id: CompanionId) => void;
};

export function CompanionPicker({ companions, value, onChange }: CompanionPickerProps) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;
  const ids = React.useMemo(() => companions.map((c) => c.id), [companions]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = ids.indexOf(value);
    if (idx < 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(ids[(idx + 1) % ids.length]!);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(ids[(idx - 1 + ids.length) % ids.length]!);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(ids[0]!);
    } else if (e.key === "End") {
      e.preventDefault();
      onChange(ids[ids.length - 1]!);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Elige tu compañía — acento y alma
      </p>
      <div
        role="radiogroup"
        aria-label="Compañero de chat por región"
        onKeyDown={onKeyDown}
        className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible"
      >
        {companions.map((c) => {
          const active = c.id === value;
          return (
            <motion.button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(c.id)}
              whileHover={reduce ? undefined : { scale: 1.02 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={cn(
                "flex min-w-[10.5rem] shrink-0 flex-col rounded-2xl border p-3 text-left transition-shadow duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-w-0 sm:flex-1 sm:basis-[calc(50%-0.375rem)] lg:basis-[calc(25%-0.5rem)]",
                active
                  ? "border-fiesta-gold/60 bg-fiesta-crimson/20 shadow-lg shadow-fiesta-gold/10 ring-2 ring-fiesta-gold/30"
                  : "border-border/60 bg-card/50 hover:border-fiesta-gold/30",
              )}
            >
              <span className="text-2xl leading-none" aria-hidden>
                {c.flag}
              </span>
              <span className="mt-2 font-[family-name:var(--font-heading)] text-base font-semibold text-foreground">
                {c.name}
              </span>
              <span className="text-[11px] font-medium text-fiesta-orange">{c.region}</span>
              <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {c.tagline}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
