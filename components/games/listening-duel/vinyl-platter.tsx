"use client";

import { motion, useReducedMotion } from "framer-motion";

type VinylPlatterProps = {
  isPlaying: boolean;
  size?: number;
  className?: string;
};

/** Spinning vinyl with groove rings — slows when not playing */
export function VinylPlatter({ isPlaying, size = 220, className }: VinylPlatterProps) {
  const reduce = useReducedMotion() === true;

  return (
    <div className={className} style={{ width: size, height: size }}>
      <motion.div
        className="relative mx-auto rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_2px_8px_rgba(255,255,255,0.08)]"
        style={{ width: size, height: size }}
        animate={
          reduce
            ? undefined
            : {
                rotate: isPlaying ? 360 : 0,
              }
        }
        transition={
          reduce
            ? undefined
            : isPlaying
              ? { rotate: { repeat: Infinity, duration: 2.8, ease: "linear" } }
              : { duration: 0.4 }
        }
      >
        <div
          className="absolute inset-0 rounded-full bg-linear-to-br from-zinc-900 via-zinc-950 to-black"
          style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.9)" }}
        />
        {[0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72].map((r, i) => (
          <div
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-zinc-700/35"
            style={{
              width: `${r * 100}%`,
              height: `${r * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-1/2 size-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-[#c60b1e] via-[#7f1d1d] to-black shadow-inner"
          style={{ boxShadow: "inset 0 0 12px rgba(0,0,0,0.6)" }}
        />
        <div className="absolute left-1/2 top-1/2 size-[10%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300 shadow-md ring-2 ring-zinc-600" />
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.12),transparent_45%)]" />
      </motion.div>
    </div>
  );
}
