"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConnectingProps = {
  context?: string;
  title?: string;
  description?: string;
};

/** Shown while Next.js Suspense resolves search params, or while the game checks Supabase + auth. */
export function MultiplayerConnectingSpinner({
  context,
  title = "Connecting to Duende servers…",
  description = "Checking your account and multiplayer services. This usually takes a second.",
}: ConnectingProps) {
  React.useEffect(() => {
    console.log("[duende-mp] Connecting spinner:", context ?? "(no context)", { title });
  }, [context, title]);

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-12 shrink-0 animate-spin text-fiesta-gold" aria-hidden />
      <div className="text-center">
        <p className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

type MultiplayerErrorPanelProps = {
  title: string;
  message: string;
  /** Raw error for debugging — shown in a scrollable box */
  technical?: string | null;
  className?: string;
};

export function MultiplayerErrorPanel({ title, message, technical, className }: MultiplayerErrorPanelProps) {
  React.useEffect(() => {
    console.error("[duende-mp] Error panel shown:", title, message, technical ?? "");
  }, [title, message, technical]);

  return (
    <div className={cn("mx-auto max-w-lg px-4 py-10 sm:px-6", className)}>
      <div
        className="rounded-2xl border border-fiesta-orange/40 bg-fiesta-orange/10 p-5 shadow-lg"
        role="alert"
      >
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-fiesta-orange" aria-hidden />
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-foreground">{title}</h2>
            <p className="text-sm text-foreground/90">{message}</p>
            {technical ? (
              <details className="rounded-lg border border-border/80 bg-background/80 p-3">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                  {technical}
                </pre>
              </details>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/games" className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2")}>
            Back to Games
          </Link>
          <Link
            href="/games/palabra-vortex"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            Solo Palabra Vortex
          </Link>
        </div>
      </div>
    </div>
  );
}
