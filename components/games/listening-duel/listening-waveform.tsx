"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

const BARS = 40;

type ListeningWaveformProps = {
  isActive: boolean;
  className?: string;
};

/** Animated faux waveform — reads premium during TTS / playback */
export function ListeningWaveform({ isActive, className }: ListeningWaveformProps) {
  const reduce = useReducedMotion() === true;
  const [t, setT] = React.useState(0);

  React.useEffect(() => {
    if (!isActive || reduce) return;
    let raf: number;
    const loop = () => {
      setT((x) => x + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [isActive, reduce]);

  return (
    <div
      className={`flex h-16 items-end justify-center gap-0.5 sm:h-20 sm:gap-px ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: BARS }, (_, i) => {
        const phase = t * 0.08 + i * 0.35;
        const base = isActive && !reduce ? (Math.sin(phase) * 0.35 + Math.sin(phase * 1.7) * 0.25 + 0.55) : 0.12;
        const h = Math.max(8, base * 100);
        return (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-linear-to-t from-[#c60b1e]/90 via-[#ffc400] to-amber-200/90 sm:w-1.5"
            animate={{ height: `${h}%` }}
            transition={{ type: "tween", duration: reduce ? 0 : 0.06 }}
            style={{ maxHeight: "100%" }}
          />
        );
      })}
    </div>
  );
}
