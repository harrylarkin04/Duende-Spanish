import { AlertCircle } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * Inline error surface with optional retry — use with `role="alert"` on wrapper if single focus.
 */
export function ErrorState({
  title = "Algo salió mal",
  message,
  onRetry,
  retryLabel = "Reintentar",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-fiesta-orange/35 bg-fiesta-orange/10 px-4 py-4 text-left",
        className,
      )}
    >
      <div className="flex gap-3">
        <AlertCircle
          className="mt-0.5 size-5 shrink-0 text-fiesta-orange"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 border-fiesta-gold/35"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
