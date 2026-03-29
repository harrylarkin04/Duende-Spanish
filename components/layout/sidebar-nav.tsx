"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { isNavActive, MAIN_NAV } from "@/lib/nav-config";

export function SidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="flex h-dvh w-64 shrink-0 flex-col border-r border-fiesta-gold/10 bg-card/40 backdrop-blur-xl">
      <div className="border-b border-border/60 px-5 py-6">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-md"
        >
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Duende
          </span>
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Spanish immersion</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Navegación principal">
        {MAIN_NAV.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                active
                  ? "bg-fiesta-crimson/25 text-fiesta-gold shadow-[0_0_28px_rgba(251,191,36,0.18),inset_0_0_20px_rgba(159,18,57,0.12)] ring-1 ring-fiesta-gold/50"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {active && (
                <span
                  className="absolute inset-y-1 left-0 w-1 rounded-full bg-linear-to-b from-fiesta-gold to-fiesta-orange shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  "relative z-[1] size-5 shrink-0 transition-transform duration-300",
                  active && "scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                )}
              />
              <span className="relative z-[1]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <SignOutButton className="mb-2 w-full border-fiesta-gold/25" />
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Link
          href="/design-showcase"
          className="mt-2 block rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-fiesta-gold"
        >
          Design system
        </Link>
      </div>
    </aside>
  );
}
