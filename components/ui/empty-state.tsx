import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Consistent empty / “nothing here yet” surface.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl border border-dashed border-fiesta-gold/25 bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-fiesta-crimson/15 text-fiesta-gold">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}
