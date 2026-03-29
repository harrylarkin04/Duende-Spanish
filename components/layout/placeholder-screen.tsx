"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlaceholderScreenProps = {
  kicker?: string;
  title: string;
  description: string;
  className?: string;
};

export function PlaceholderScreen({
  kicker,
  title,
  description,
  className,
}: PlaceholderScreenProps) {
  return (
    <div className={cn("mx-auto max-w-2xl px-4 py-10 sm:px-6", className)}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {kicker && (
          <p className="text-xs font-semibold uppercase tracking-widest text-fiesta-gold">{kicker}</p>
        )}
        <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
