"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

type VictoryConfettiProps = {
  active: boolean;
  className?: string;
};

/** Spanish-flag inspired burst: crimson, gold, and cream strips */
export function VictoryConfetti({ active, className }: VictoryConfettiProps) {
  const reduce = useReducedMotion();
  const [on, setOn] = React.useState(false);
  const [burstVer, setBurstVer] = React.useState(0);

  React.useEffect(() => {
    if (active && !reduce) {
      setBurstVer((v) => v + 1);
      setOn(true);
      const t = window.setTimeout(() => setOn(false), 3200);
      return () => window.clearTimeout(t);
    }
    setOn(false);
  }, [active, reduce]);

  if (!on || reduce) return null;

  const n = 72;
  const colors = [
    "bg-[#c60b1e]",
    "bg-[#ffc400]",
    "bg-[#aa151b]",
    "bg-amber-200",
    "bg-fiesta-gold",
    "bg-fiesta-orange",
  ];

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: n }, (_, i) => {
        const x = (i * 47) % 100;
        const delay = (i % 12) * 0.02;
        const rot = (i * 31) % 360;
        const w = 6 + (i % 4) * 2;
        const h = 10 + (i % 5) * 2;
        return (
          <motion.span
            key={`vc-${burstVer}-${i}`}
            className={`absolute rounded-sm shadow-sm ${colors[i % colors.length]}`}
            style={{
              left: `${x}vw`,
              top: "-8%",
              width: w,
              height: h,
              rotate: rot,
            }}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.2 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 110 + (i % 8) * 8, 118 + (i % 5) * 14],
              x: [(i % 5) - 2, (i % 11) - 5, (i % 7) - 3],
              rotate: [rot, rot + 180, rot + 360],
              scale: [0.2, 1, 1.1, 0.4],
            }}
            transition={{
              duration: 2.4,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        );
      })}
    </div>
  );
}
