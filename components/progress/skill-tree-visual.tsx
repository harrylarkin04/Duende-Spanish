"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Headphones,
  Landmark,
  Mic,
  SpellCheck2,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import type { SkillBranch } from "@/lib/progress/compute-progress";
import { cn } from "@/lib/utils";

const ICONS: Record<SkillBranch["id"], LucideIcon> = {
  vocabulary: BookOpen,
  grammar: SpellCheck2,
  speaking: Mic,
  listening: Headphones,
  culture: Landmark,
};

const ORDER: SkillBranch["id"][] = [
  "vocabulary",
  "grammar",
  "speaking",
  "listening",
  "culture",
];

type Props = {
  branches: SkillBranch[];
  fluency: number;
  className?: string;
};

export function SkillTreeVisual({ branches, fluency, className }: Props) {
  const reduce = useReducedMotion();
  const byId = React.useMemo(
    () => new Map(branches.map((b) => [b.id, b])),
    [branches],
  );

  const cx = 200;
  const cy = 200;
  const r = 128;
  const angles = ORDER.map((_, i) => (-90 + (360 / 5) * i) * (Math.PI / 180));

  return (
    <div className={cn("relative", className)}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-fiesta-gold/90">
        Árbol de habilidades
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Cinco pilares conectados a tu práctica real en juegos y charlas.
      </p>

      <div className="mx-auto max-w-md">
        <svg
          viewBox="0 0 400 400"
          className="h-auto w-full drop-shadow-lg"
          aria-label="Árbol de habilidades"
        >
          <defs>
            <linearGradient id="tree-line" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(159 18 57 / 0.45)" />
              <stop offset="100%" stopColor="rgb(251 191 36 / 0.5)" />
            </linearGradient>
            <radialGradient id="tree-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(251 191 36 / 0.35)" />
              <stop offset="100%" stopColor="rgb(159 18 57 / 0.5)" />
            </radialGradient>
          </defs>

          {angles.map((ang, i) => {
            const id = ORDER[i];
            const nx = cx + Math.cos(ang) * r;
            const ny = cy + Math.sin(ang) * r;
            return (
              <line
                key={id}
                x1={cx}
                y1={cy}
                x2={nx}
                y2={ny}
                stroke="url(#tree-line)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}

          <motion.circle
            cx={cx}
            cy={cy}
            r={52}
            fill="url(#tree-core)"
            stroke="rgb(251 191 36 / 0.55)"
            strokeWidth={2}
            animate={
              reduce
                ? undefined
                : { scale: [1, 1.03, 1], opacity: [0.95, 1, 0.95] }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            Duende
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className="fill-fiesta-gold text-lg font-bold"
            style={{ fontFamily: "var(--font-sans), sans-serif" }}
          >
            {fluency}
          </text>
          <text
            x={cx}
            y={cy + 30}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            fluidez
          </text>

          {angles.map((ang, i) => {
            const id = ORDER[i];
            const b = byId.get(id);
            if (!b) return null;
            const nx = cx + Math.cos(ang) * r;
            const ny = cy + Math.sin(ang) * r;
            const Icon = ICONS[id];
            const unlocked = b.unlocked;
            return (
              <g key={id}>
                <motion.circle
                  cx={nx}
                  cy={ny}
                  r={36}
                  className={cn(
                    unlocked
                      ? "fill-card stroke-fiesta-gold/50"
                      : "fill-muted/40 stroke-border",
                  )}
                  strokeWidth={2}
                  initial={false}
                  animate={
                    reduce || !unlocked
                      ? undefined
                      : {
                          filter: [
                            "drop-shadow(0 0 0px transparent)",
                            "drop-shadow(0 0 10px rgb(251 191 36 / 0.45))",
                            "drop-shadow(0 0 0px transparent)",
                          ],
                        }
                  }
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
                <foreignObject
                  x={nx - 12}
                  y={ny - 22}
                  width={24}
                  height={24}
                  className="pointer-events-none overflow-visible"
                >
                  <div className="flex h-6 w-6 items-center justify-center text-fiesta-gold">
                    <Icon
                      className={cn(
                        "size-5",
                        !unlocked && "text-muted-foreground opacity-50",
                      )}
                      aria-hidden
                    />
                  </div>
                </foreignObject>
                <text
                  x={nx}
                  y={ny + 8}
                  textAnchor="middle"
                  className={cn(
                    "fill-foreground text-[10px] font-medium",
                    !unlocked && "fill-muted-foreground",
                  )}
                >
                  {b.shortLabel}
                </text>
                <text
                  x={nx}
                  y={ny + 22}
                  textAnchor="middle"
                  className="fill-fiesta-gold text-[11px] font-bold"
                >
                  {unlocked ? `${b.value}%` : "—"}
                </text>
              </g>
            );
          })}
        </svg>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {branches.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm backdrop-blur-sm"
            >
              <span className="text-muted-foreground">{b.label}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  b.unlocked ? "text-fiesta-gold" : "text-muted-foreground",
                )}
              >
                {b.unlocked ? `${b.value}%` : "Próximamente"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
