"use client";

import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { DailyRitualFab } from "@/components/layout/daily-ritual-fab";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const HIDE_SHELL = ["/design-showcase"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hide = HIDE_SHELL.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (hide) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh">
      <div className="hidden md:block">
        <SidebarNav />
      </div>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="flex-1 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] md:pb-10 md:pt-0">
          {children}
        </main>
        <BottomNav />
        <DailyRitualFab />
      </div>
    </div>
  );
}
