"use client";

import { motion, useReducedMotion } from "framer-motion";

type FieryBurstProps = {
  trigger: number;
  className?: string;
  /** Extra particles for personal records / big moments */
  intensity?: "normal" | "mega";
};

/** Correct-answer confetti: ember + gold sparks */
export function FieryBurst({ trigger, className, intensity = "normal" }: FieryBurstProps) {
  const reduce = useReducedMotion();
  if (trigger === 0 || reduce) return null;

  const n = intensity === "mega" ? 52 : 22;
  const palette = [
    "bg-fiesta-gold",
    "bg-fiesta-orange",
    "bg-fiesta-crimson",
    "bg-amber-300",
    "bg-red-500",
  ];

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: n }, (_, i) => {
        const angle = (i / n) * Math.PI * 2;
        const dist = 56 + (i % 5) * 16;
        const size = i % 3 === 0 ? 10 : 6;
        return (
          <motion.span
            key={`${trigger}-f-${i}`}
            className={`absolute rounded-full ${palette[i % palette.length]} shadow-[0_0_14px_rgba(251,146,60,0.85)]`}
            style={{ width: size, height: size }}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1.3, 0.4],
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              rotate: i % 2 === 0 ? 180 : -180,
            }}
            transition={{
              duration: 0.95,
              ease: [0.22, 1, 0.36, 1],
              delay: i * 0.018,
            }}
          />
        );
      })}
    </div>
  );
}
