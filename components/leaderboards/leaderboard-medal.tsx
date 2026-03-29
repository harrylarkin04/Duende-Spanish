"use client";

import { Medal } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function LeaderboardMedal({ rank, className }: { rank: number; className?: string }) {
  if (rank > 3) {
    return (
      <span className={cn("inline-flex size-8 items-center justify-center font-mono text-sm font-bold text-muted-foreground", className)}>
        {rank}
      </span>
    );
  }

  const style =
    rank === 1
      ? "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]"
      : rank === 2
        ? "text-slate-300 drop-shadow-[0_0_8px_rgba(148,163,184,0.45)]"
        : "text-orange-400/90 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]";

  return (
    <span className={cn("relative inline-flex size-8 items-center justify-center", className)} aria-hidden>
      <Medal className={cn("size-8", style)} strokeWidth={1.5} />
      <span className="absolute inset-0 flex items-center justify-center pt-0.5 text-[10px] font-bold text-background">
        {rank}
      </span>
    </span>
  );
}
