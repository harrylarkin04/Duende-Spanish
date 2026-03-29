"use client";

import { motion, useReducedMotion } from "framer-motion";

type WinBurstProps = {
  /** Increment to trigger a new burst */
  burstKey: number;
  className?: string;
};

/**
 * Gold / crimson confetti burst for “wins” (e.g. region taps).
 */
export function WinBurst({ burstKey, className }: WinBurstProps) {
  const reduce = useReducedMotion();
  if (burstKey === 0 || reduce) return null;

  const n = 14;
  const colors = [
    "bg-fiesta-gold",
    "bg-fiesta-orange",
    "bg-fiesta-crimson",
    "bg-amber-200",
  ];

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2;
        const dist = 48 + (i % 4) * 12;
        return (
          <motion.span
            key={`${burstKey}-${i}`}
            className={`absolute size-2 rounded-full ${colors[i % colors.length]} shadow-[0_0_12px_rgba(251,191,36,0.7)]`}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.2, 0.6],
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
              delay: i * 0.02,
            }}
          />
        );
      })}
    </div>
  );
}
