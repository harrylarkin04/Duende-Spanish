"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const TOTAL = 84;

function dateForIndex(i: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - (TOTAL - 1 - i));
  return d;
}

function intensityClass(n: number, max: number): string {
  if (n <= 0) return "bg-muted/80 ring-1 ring-border/40";
  const t = Math.min(1, n / max);
  if (t < 0.25) return "bg-fiesta-crimson/25 ring-1 ring-fiesta-crimson/20";
  if (t < 0.5) return "bg-fiesta-crimson/45 ring-1 ring-fiesta-gold/15";
  if (t < 0.75) return "bg-fiesta-orange/55 ring-1 ring-fiesta-gold/25";
  return "bg-fiesta-gold/70 ring-1 ring-fiesta-gold/40 shadow-[0_0_8px_rgba(251,191,36,0.35)]";
}

type Props = {
  levels: number[];
  max: number;
  className?: string;
};

export function ActivityHeatmap({ levels, max, className }: Props) {
  const [tip, setTip] = React.useState<{
    i: number;
    x: number;
    y: number;
  } | null>(null);

  const weeks = 12;
  const days = 7;

  return (
    <div className={cn("relative", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-fiesta-gold/90">
            Ritmo diario
          </p>
          <p className="text-sm text-muted-foreground">
            Partidas de Palabra por día · últimas 12 semanas
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="rounded-sm bg-muted/80 px-1.5 py-0.5">0</span>
          <span className="text-muted-foreground/70">→</span>
          <span className="rounded-sm bg-fiesta-gold/70 px-1.5 py-0.5 text-foreground/80">
            más
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-min gap-1">
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} className="flex flex-col gap-0.5">
              {Array.from({ length: days }, (_, d) => {
                const idx = w * 7 + d;
                const n = levels[idx] ?? 0;
                const date = dateForIndex(idx);
                const label = date.toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <button
                    key={idx}
                    type="button"
                    title={`${label}: ${n} partida${n === 1 ? "" : "s"}`}
                    className={cn(
                      "size-3 rounded-sm transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/50 sm:size-3.5",
                      intensityClass(n, max),
                    )}
                    onMouseEnter={(e) =>
                      setTip({
                        i: idx,
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                    onMouseMove={(e) =>
                      setTip((t) =>
                        t && t.i === idx
                          ? { ...t, x: e.clientX, y: e.clientY }
                          : t,
                      )
                    }
                    onMouseLeave={() => setTip(null)}
                    onFocus={() => {}}
                    onBlur={() => setTip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {tip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-fiesta-gold/30 bg-popover/95 px-2 py-1 text-xs text-popover-foreground shadow-lg backdrop-blur-sm"
          style={{
            left: tip.x + 12,
            top: tip.y + 12,
          }}
        >
          {dateForIndex(tip.i).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
          <span className="block text-fiesta-gold">
            {levels[tip.i] ?? 0} partida
            {(levels[tip.i] ?? 0) === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );
}
