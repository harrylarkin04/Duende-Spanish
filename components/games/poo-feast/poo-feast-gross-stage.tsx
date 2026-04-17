"use client";

import { motion, useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

type PooFeastGrossStageProps = {
  className?: string;
  /** 0–1 visual intensity (drives fly count + gas opacity) */
  stenchLevel?: number;
  caption?: string;
  tapHint?: string;
};

/** Stylised cartoon pile — splats, vapor, flies. Interactive (tap / Enter). */
export function PooFeastGrossStage({
  className,
  stenchLevel = 0.85,
  caption,
  tapHint,
}: PooFeastGrossStageProps): React.ReactElement {
  const reduce = useReducedMotion() === true;
  const [squish, setSquish] = React.useState(0);

  const onSquish = React.useCallback(() => {
    if (reduce) return;
    setSquish((s) => s + 1);
  }, [reduce]);

  const flies = Math.min(12, 5 + Math.round(stenchLevel * 8));

  return (
    <div className={cn("relative mx-auto w-full max-w-lg select-none", className)}>
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-linear-to-b from-[#1a1510] via-[#0f0d0b] to-[#1c1410] p-4 shadow-[inset_0_0_60px_rgba(0,0,0,0.65)]"
        animate={reduce ? undefined : { scale: [1, 1.008, 1] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          viewBox="0 0 420 280"
          className="h-auto w-full touch-manipulation"
          role="img"
          aria-label={caption ?? "Cartoon compost pile"}
          onClick={onSquish}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSquish();
            }
          }}
          tabIndex={0}
        >
          <defs>
            <radialGradient id="pf-goo-core" cx="45%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#6b4a2f" />
              <stop offset="55%" stopColor="#3d2618" />
              <stop offset="100%" stopColor="#1f130c" />
            </radialGradient>
            <radialGradient id="pf-goo-shine" cx="35%" cy="35%" r="40%">
              <stop offset="0%" stopColor="#a67c52" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#3d2618" stopOpacity="0" />
            </radialGradient>
            <filter id="pf-blur-gas" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="pf-blur-chunk" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          <ellipse cx="210" cy="248" rx="140" ry="18" fill="#120c09" opacity="0.85" />

          {[0, 1, 2].map((i) => (
            <motion.ellipse
              key={`gas-${i}`}
              cx={120 + i * 65}
              cy={40 + i * 12}
              rx={55 + i * 8}
              ry={28 + i * 5}
              fill={i % 2 === 0 ? "#4a6b2f" : "#6b8f3a"}
              opacity={0.22 + stenchLevel * 0.12}
              filter="url(#pf-blur-gas)"
              animate={
                reduce
                  ? undefined
                  : {
                      cx: [120 + i * 65, 128 + i * 62, 120 + i * 65],
                      cy: [40 + i * 12, 36 + i * 10, 40 + i * 12],
                    }
              }
              transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          <motion.g
            animate={
              reduce
                ? undefined
                : {
                    rotate: [0, squish % 2 === 0 ? -1.4 : 1.4, 0],
                    scale: 1 - Math.min(squish, 10) * 0.01,
                  }
            }
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            style={{ transformOrigin: "210px 170px" }}
          >
            <path
              d="M70 195 C90 120 160 95 210 105 C260 95 340 130 355 185 C368 225 310 252 210 258 C110 252 52 235 70 195Z"
              fill="url(#pf-goo-core)"
              stroke="#2a1810"
              strokeWidth="2"
            />
            <path
              d="M95 175 C120 140 175 125 215 132 C265 118 330 145 338 185 C318 165 260 155 215 162 C165 152 115 158 95 175Z"
              fill="url(#pf-goo-shine)"
              opacity="0.9"
            />
            <ellipse cx="155" cy="175" rx="38" ry="22" fill="#4a3220" opacity="0.95" filter="url(#pf-blur-chunk)" />
            <ellipse cx="265" cy="188" rx="44" ry="26" fill="#5c3d28" opacity="0.88" />
            <ellipse cx="210" cy="215" rx="52" ry="18" fill="#2d1a12" opacity="0.85" />
            <ellipse cx="185" cy="165" rx="6" ry="4" fill="#e8d35c" opacity="0.65" />
            <ellipse cx="248" cy="198" rx="5" ry="3" fill="#c49a4a" opacity="0.55" />
          </motion.g>

          {!reduce &&
            Array.from({ length: Math.min(14, squish * 2) }).map((_, i) => (
              <motion.circle
                key={`spl-${squish}-${i}`}
                r={3 + (i % 3)}
                fill="#5c4030"
                initial={{ cx: 210, cy: 175, opacity: 0.85 }}
                animate={{
                  cx: 210 + Math.sin(i * 1.7 + squish) * (45 + i * 4),
                  cy: 165 + Math.cos(i * 2.1) * (35 + i * 3),
                  opacity: 0,
                }}
                transition={{ duration: 0.85, ease: "easeOut" }}
              />
            ))}

          {Array.from({ length: flies }).map((_, i) => (
            <motion.g
              key={`fly-${i}`}
              animate={
                reduce
                  ? undefined
                  : {
                      x: [0, 14, -6, 0],
                      y: [0, -10, 4, 0],
                    }
              }
              transition={{
                duration: 2.1 + (i % 4) * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.07,
              }}
              style={{
                transformOrigin: `${90 + (i * 41) % 240}px ${48 + (i * 29) % 70}px`,
              }}
            >
              <g transform={`translate(${90 + (i * 41) % 240}, ${48 + (i * 29) % 70})`}>
                <ellipse cx="0" cy="0" rx="6" ry="3.5" fill="#151515" />
                <line x1="-8" y1="-1" x2="8" y2="2" stroke="#222" strokeWidth="1.4" />
              </g>
            </motion.g>
          ))}

          <motion.path
            d="M130 52 Q210 25 290 52"
            fill="none"
            stroke="#9acd32"
            strokeWidth="3"
            strokeOpacity="0.38"
            strokeDasharray="6 10"
            animate={reduce ? undefined : { strokeDashoffset: [0, -36] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col gap-1 rounded-lg bg-black/55 px-3 py-2 text-[0.72rem] text-amber-100/90 backdrop-blur-sm">
          {caption != null && <p className="font-medium leading-snug">{caption}</p>}
          {tapHint != null && !reduce && <p className="text-amber-200/75">{tapHint}</p>}
          {!reduce && (
            <p className="tabular-nums text-[0.65rem] text-muted-foreground">
              Splats · {squish} · Toxicity {(stenchLevel * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
