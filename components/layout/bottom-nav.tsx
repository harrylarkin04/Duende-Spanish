"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isNavActive, MAIN_NAV } from "@/lib/nav-config";

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-fiesta-gold/15 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 pt-1">
        {MAIN_NAV.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active ? "text-fiesta-gold" : "text-muted-foreground active:scale-95",
              )}
            >
              {active && (
                <span
                  className="absolute inset-x-2 -top-px h-0.5 rounded-full bg-linear-to-r from-transparent via-fiesta-gold to-transparent shadow-[0_0_16px_rgba(251,191,36,0.85)]"
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "relative flex size-10 items-center justify-center rounded-xl transition-all duration-300",
                  active
                    ? "bg-fiesta-crimson/35 shadow-[0_0_20px_rgba(251,191,36,0.35)] ring-1 ring-fiesta-gold/45"
                    : "bg-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "size-[1.35rem] shrink-0",
                    active && "drop-shadow-[0_0_10px_rgba(251,191,36,0.55)]",
                  )}
                />
              </span>
              <span className="max-w-full truncate px-0.5 text-[9px] font-semibold leading-tight sm:text-[10px]">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
