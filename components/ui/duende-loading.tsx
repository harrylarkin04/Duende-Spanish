"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";

import { SPANISH_LOADING_PHRASES } from "@/lib/messages/loading";
import { cn } from "@/lib/utils";

type DuendeLoadingProps = {
  className?: string;
  /** Screen-reader label */
  label?: string;
  /** Tighter layout for chart shells */
  compact?: boolean;
  /** Milliseconds between phrase changes */
  phraseIntervalMs?: number;
};

/**
 * Accessible loading block with rotating Spanish flair.
 */
export function DuendeLoading({
  className,
  label = "Cargando",
  compact = false,
  phraseIntervalMs = 2400,
}: DuendeLoadingProps) {
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % SPANISH_LOADING_PHRASES.length);
    }, phraseIntervalMs);
    return () => window.clearInterval(t);
  }, [phraseIntervalMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn(
        "flex items-center justify-center gap-3 text-muted-foreground",
        compact ? "py-6 text-xs" : "flex-col py-10 text-sm",
        className,
      )}
    >
      <Loader2
        className={cn(
          "shrink-0 animate-spin text-fiesta-gold",
          compact ? "size-5" : "size-8",
        )}
        aria-hidden
      />
      <p
        className={cn(
          "max-w-[16rem] text-center font-medium leading-snug text-foreground/85",
          compact && "max-w-[14rem] text-left text-xs font-normal",
        )}
      >
        {SPANISH_LOADING_PHRASES[i]}
      </p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
