"use client";

import { motion, useReducedMotion } from "framer-motion";

type TypingIndicatorProps = {
  label?: string;
};

export function TypingIndicator({ label = "Escribiendo…" }: TypingIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  return (
    <div
      className="flex max-w-[85%] flex-col gap-1 rounded-2xl border border-fiesta-gold/20 bg-card/60 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) =>
            reduce ? (
              <span key={i} className="size-2 rounded-full bg-fiesta-orange/80" />
            ) : (
              <motion.span
                key={i}
                className="size-2 rounded-full bg-fiesta-orange"
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ),
          )}
        </div>
        <span className="italic text-foreground/90">{label}</span>
      </div>
      <p className="pl-[2.25rem] text-[11px] leading-snug text-muted-foreground">
        El Duende está tejiendo la respuesta…
      </p>
    </div>
  );
}
