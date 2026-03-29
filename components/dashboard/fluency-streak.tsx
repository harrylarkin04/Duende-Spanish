"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame } from "lucide-react";

type FluencyStreakProps = {
  fluencyPercent: number;
  weeklyPercent: number;
  streakDays: number;
  labels: {
    fluencyCaption: string;
    weekly: string;
    weeklyHint: string;
    streakHint: string;
  };
};

/**
 * Dual progress rings + streak + stylized flamenco-inspired avatar.
 */
export function FluencyStreak({
  fluencyPercent,
  weeklyPercent,
  streakDays,
  labels,
}: FluencyStreakProps) {
  const reduce = useReducedMotion();
  const rOuter = 52;
  const rInner = 36;
  const cOuter = 2 * Math.PI * rOuter;
  const cInner = 2 * Math.PI * rInner;

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
      <div className="flex items-center gap-6">
        <div className="relative size-[132px] shrink-0">
          <svg
            width="132"
            height="132"
            viewBox="0 0 132 132"
            className="-rotate-90"
            aria-hidden
          >
            <defs>
              <linearGradient id="ring-outer" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#9f1239" />
              </linearGradient>
              <linearGradient id="ring-inner" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <circle
              cx="66"
              cy="66"
              r={rOuter}
              fill="none"
              className="stroke-muted/40"
              strokeWidth="10"
            />
            <motion.circle
              cx="66"
              cy="66"
              r={rOuter}
              fill="none"
              stroke="url(#ring-outer)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={cOuter}
              initial={reduce ? false : { strokeDashoffset: cOuter }}
              animate={{ strokeDashoffset: cOuter * (1 - fluencyPercent / 100) }}
              transition={{ duration: reduce ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <circle
              cx="66"
              cy="66"
              r={rInner}
              fill="none"
              className="stroke-muted/30"
              strokeWidth="6"
            />
            <motion.circle
              cx="66"
              cy="66"
              r={rInner}
              fill="none"
              stroke="url(#ring-inner)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={cInner}
              initial={reduce ? false : { strokeDashoffset: cInner }}
              animate={{ strokeDashoffset: cInner * (1 - weeklyPercent / 100) }}
              transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-[family-name:var(--font-heading)] text-2xl font-bold tabular-nums text-foreground">
              {fluencyPercent}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {labels.fluencyCaption}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{labels.weekly}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fiesta-gold">
            {weeklyPercent}%
          </p>
          <p className="text-xs text-muted-foreground">{labels.weeklyHint}</p>
        </div>
      </div>

      <div className="flex w-full max-w-xs items-center gap-4 rounded-2xl border border-fiesta-gold/20 bg-card/60 px-4 py-4 backdrop-blur-md sm:w-auto">
        <FlamencoAvatar />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Flame className="size-5 shrink-0 text-fiesta-orange" />
            <motion.span
              className="font-[family-name:var(--font-heading)] text-3xl font-bold tabular-nums text-foreground"
              key={streakDays}
              initial={reduce ? false : { scale: 1.2, color: "#fbbf24" }}
              animate={{ scale: 1, color: "inherit" }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              {streakDays}
            </motion.span>
          </div>
          <p className="text-xs text-muted-foreground">{labels.streakHint}</p>
        </div>
      </div>
    </div>
  );
}

function FlamencoAvatar() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="relative flex shrink-0 flex-col items-center"
      animate={reduce ? undefined : { rotate: [-3, 3, -3] }}
      transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
    >
      {/* Fan */}
      <motion.div
        className="absolute -right-1 top-5 z-10 text-xl leading-none"
        animate={reduce ? undefined : { rotate: [0, 18, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        aria-hidden
      >
        🪭
      </motion.div>
      {/* Head */}
      <div className="relative z-[1] size-11 rounded-full bg-linear-to-br from-amber-100 via-rose-200 to-fiesta-crimson/40 ring-2 ring-fiesta-gold/50 shadow-md" />
      {/* Dress / bata de cola suggestion */}
      <div className="-mt-1 flex flex-col items-center">
        <div className="h-10 w-14 rounded-t-full bg-linear-to-b from-fiesta-crimson via-fiesta-crimson to-fiesta-crimson/80 shadow-lg shadow-fiesta-crimson/30" />
        <motion.div
          className="-mt-1 h-3 w-20 rounded-full bg-linear-to-r from-fiesta-crimson via-fiesta-orange/80 to-fiesta-gold/60 opacity-90"
          animate={reduce ? undefined : { scaleX: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
