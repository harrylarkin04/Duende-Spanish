"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DAILY_RITUAL_HREF } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

/**
 * Floating entry to the Daily Duende Ritual (dashboard anchor).
 * Hidden on /chat so the composer + bottom nav stay clean.
 */
export function DailyRitualFab() {
  const pathname = usePathname() ?? "";
  const reduce = useReducedMotion();

  if (pathname.startsWith("/chat")) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "pointer-events-none fixed z-50",
        "right-3 bottom-[calc(5.35rem+env(safe-area-inset-bottom))] sm:right-4",
        "md:bottom-8 md:left-[calc(16rem+1.25rem)] md:right-auto",
      )}
      animate={reduce ? undefined : { y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
    >
      <Link
        href={DAILY_RITUAL_HREF}
        aria-label="Abrir ritual diario Duende en el inicio"
        className={cn(
          "pointer-events-auto flex items-center gap-2 rounded-full border border-fiesta-gold/50 bg-linear-to-r from-fiesta-crimson via-fiesta-crimson to-fiesta-crimson/90 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_28px_rgba(251,191,36,0.4),0_8px_20px_rgba(159,18,57,0.3)] ring-2 ring-fiesta-gold/30 transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:text-xs",
        )}
      >
        <Sparkles className="size-3.5 shrink-0 text-fiesta-gold sm:size-4" aria-hidden />
        Daily Ritual
      </Link>
    </motion.div>
  );
}
