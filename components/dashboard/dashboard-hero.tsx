"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Sparkles } from "lucide-react";

type DashboardHeroProps = {
  title: string;
  tagline: string;
  badge: string;
};

const letterParent: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.045, delayChildren: 0.08 },
  },
};

const letterChild: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export function DashboardHero({ title, tagline, badge }: DashboardHeroProps) {
  const reduce = useReducedMotion();
  const letters = title.split("");

  return (
    <div className="relative text-center sm:text-left">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold backdrop-blur-md sm:text-sm"
      >
        <Sparkles className="size-3.5 text-fiesta-orange sm:size-4" />
        {badge}
      </motion.div>

      {reduce ? (
        <h1 className="font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
      ) : (
        <motion.h1
          className="font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          variants={letterParent}
          initial="hidden"
          animate="show"
        >
          {letters.map((char, i) => (
            <motion.span
              key={`${char}-${i}`}
              variants={letterChild}
              className="inline-block bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent"
              style={{ marginRight: char === " " ? "0.2em" : undefined }}
            >
              {char === " " ? "\u00a0" : char}
            </motion.span>
          ))}
        </motion.h1>
      )}

      <motion.p
        className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {tagline}
      </motion.p>

      {/* Ambient glow orbs */}
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 hidden h-56 w-56 rounded-full bg-fiesta-crimson/20 blur-[80px] sm:block" />
      <div aria-hidden className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-fiesta-gold/10 blur-[60px]" />
    </div>
  );
}
