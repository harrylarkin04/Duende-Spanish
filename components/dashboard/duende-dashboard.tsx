"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Bot,
  Compass,
  Flame,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import * as React from "react";

import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { FluencyStreak } from "@/components/dashboard/fluency-streak";
import {
  InteractiveGlobe,
  REGIONS,
  type RegionId,
} from "@/components/dashboard/interactive-globe";
import { WinBurst } from "@/components/dashboard/win-burst";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardMessages,
  defaultDashboardLocale,
  type DashboardLocale,
} from "@/lib/messages/dashboard";
import type { DashboardSnapshot } from "@/lib/data/dashboard-snapshot";
import { duendeMotion } from "@/lib/design-system";
import { useRealtimeProfileGameSync } from "@/hooks/use-supabase-game-sync";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DuendeDashboardProps = {
  locale?: DashboardLocale;
  initialSnapshot?: DashboardSnapshot | null;
};

export function DuendeDashboard({
  locale = defaultDashboardLocale,
  initialSnapshot,
}: DuendeDashboardProps) {
  const router = useRouter();
  const t = dashboardMessages[locale];
  const reduce = useReducedMotion();
  const [liveSnapshot, setLiveSnapshot] = React.useState<DashboardSnapshot | null>(null);

  const snap = liveSnapshot ?? initialSnapshot;
  const fluency = snap?.fluency ?? 0;
  const weekly = snap?.weeklyPercent ?? 0;
  const streak = snap?.currentStreak ?? 0;
  const [selectedRegion, setSelectedRegion] = React.useState<RegionId | null>(null);
  const [burstKey, setBurstKey] = React.useState(0);

  const pullSnapshot = React.useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard-snapshot", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as DashboardSnapshot | null;
      if (j) setLiveSnapshot(j);
    } catch {
      /* ignore */
    }
  }, []);

  useRealtimeProfileGameSync(() => {
    void pullSnapshot();
    router.refresh();
  });

  const handleRegion = (id: RegionId) => {
    setSelectedRegion(id);
    setBurstKey((k) => k + 1);
  };

  const regionLabel = selectedRegion
    ? REGIONS.find((r) => r.id === selectedRegion)?.label ?? ""
    : "";

  const featureItems = [
    {
      key: "palabra" as const,
      icon: Sparkles,
      href: "/games/palabra-vortex",
    },
    {
      key: "ai" as const,
      icon: Bot,
      href: "/chat",
    },
    {
      key: "media" as const,
      icon: BookOpen,
      href: "/media",
    },
    {
      key: "culture" as const,
      icon: Compass,
      href: "/quests",
    },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-hidden pb-8 md:pb-10">
      {/* Extra depth — dashboard sits on global duende-bg-canvas */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-linear-to-b from-fiesta-crimson/[0.07] via-transparent to-background opacity-90"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mb-6 flex items-start justify-end gap-3 md:hidden">
          <Link
            href="/design-showcase"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-fiesta-gold hover:underline"
          >
            Design system
          </Link>
          <ThemeToggle />
        </div>

        <DashboardHero title="Duende" tagline={t.tagline} badge={t.badgeLive} />

        {/* Progress + streak */}
        <motion.section
          className="mt-14 rounded-2xl border border-fiesta-gold/15 bg-card/40 p-6 shadow-lg shadow-fiesta-crimson/5 backdrop-blur-md sm:mt-16 sm:p-8"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          aria-labelledby="progress-heading"
        >
          <h2 id="progress-heading" className="sr-only">
            {t.fluencyLabel}
          </h2>
          <FluencyStreak
            fluencyPercent={Math.max(0, Math.min(100, fluency))}
            weeklyPercent={Math.max(0, Math.min(100, weekly))}
            streakDays={Math.max(0, streak)}
            labels={{
              fluencyCaption: t.fluencyCaption,
              weekly: t.weeklyGoal,
              weeklyHint: t.weeklyHint,
              streakHint: t.streakHint,
            }}
          />

          <div className="mt-8 grid gap-4 border-t border-fiesta-gold/10 pt-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-fiesta-orange/25 bg-fiesta-crimson/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-fiesta-orange">
                <Trophy className="size-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide">{t.weeklyRankTitle}</span>
              </div>
              <p className="text-sm text-foreground">
                {snap?.weeklyRank != null
                  ? t.weeklyRankHas
                      .replace("#{rank}", String(snap.weeklyRank))
                      .replace("{games}", String(snap.gamesThisWeek))
                  : t.weeklyRankNone.replace("{games}", String(snap?.gamesThisWeek ?? 0))}
              </p>
              <Link
                href="/leaderboards"
                className="mt-2 inline-block text-xs font-medium text-fiesta-gold underline-offset-4 hover:underline"
              >
                Ver tableros
              </Link>
            </div>
            <div className="rounded-2xl border border-fiesta-gold/20 bg-card/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-fiesta-gold">
                <Flame className="size-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide">{t.friendsStreaksTitle}</span>
              </div>
              {(snap?.friendsStreaks?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">{t.friendsStreaksEmpty}</p>
              ) : (
                <ul className="space-y-2">
                  {(snap?.friendsStreaks ?? []).map((f) => (
                    <li key={f.userId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-foreground">
                        {f.username ?? "Explorador"}
                      </span>
                      <motion.span
                        className="inline-flex shrink-0 items-center gap-1 tabular-nums text-fiesta-orange"
                        animate={reduce ? undefined : { opacity: [0.65, 1, 0.65] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Flame className="size-3.5" aria-hidden />
                        {f.currentStreak}
                      </motion.span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.section>

        {/* Map */}
        <motion.section
          className="mt-12 sm:mt-16"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, delay: reduce ? 0 : 0.06, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 text-center sm:text-left">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground sm:text-3xl">
              {t.mapTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t.mapSubtitle}</p>
          </div>

          <div className="relative">
            <WinBurst burstKey={burstKey} />
            <InteractiveGlobe selected={selectedRegion} onSelect={handleRegion} />
            {selectedRegion && burstKey > 0 && (
              <motion.p
                key={`${selectedRegion}-${burstKey}`}
                className="mt-3 text-center text-sm font-medium text-fiesta-gold sm:text-left"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                {t.regionHint}: {regionLabel}
              </motion.p>
            )}
          </div>
        </motion.section>

        {/* Daily ritual — anchor for Daily Ritual FAB */}
        <motion.section
          id="daily-ritual"
          className="mt-12 scroll-mt-28 sm:mt-16 sm:scroll-mt-24"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="relative overflow-hidden border-fiesta-gold/25 bg-linear-to-br from-fiesta-crimson/20 via-card/90 to-card/80 shadow-xl shadow-fiesta-crimson/15">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-fiesta-gold/15 blur-3xl"
            />
            <CardHeader className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-fiesta-gold/40 bg-background/50 px-2.5 py-0.5 text-xs font-medium text-fiesta-gold">
                  <Timer className="size-3.5" />
                  {t.ritualTime}
                </span>
              </div>
              <CardTitle className="mt-3 font-[family-name:var(--font-heading)] text-2xl sm:text-3xl">
                {t.ritualTitle}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {t.ritualSubtitle}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">{t.ritualTask}</p>
            </CardContent>
            <CardFooter className="relative flex flex-wrap gap-3">
              <motion.div {...(reduce ? {} : duendeMotion.springButton)}>
                <Button size="lg" className="shadow-lg shadow-fiesta-crimson/25">
                  <Sparkles data-icon="inline-start" className="size-4" />
                  {t.ritualCTA}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.section>

        {/* Feature shortcuts */}
        <section className="mt-14 sm:mt-16">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
              {t.featuresTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">{t.featuresSubtitle}</p>
          </div>

          <motion.ul
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={duendeMotion.staggerContainer}
            initial={reduce ? "show" : "hidden"}
            whileInView={reduce ? undefined : "show"}
            viewport={{ once: true, margin: "-30px" }}
          >
            {featureItems.map(({ key, icon: Icon, href }) => {
              const copy = t.features[key];
              return (
                <motion.li key={key} variants={duendeMotion.staggerItem}>
                  <motion.div
                    whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
                    whileTap={reduce ? undefined : { scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 380, damping: 26 }}
                    className="h-full"
                  >
                    <Link href={href} className="block h-full focus-visible:outline-none">
                      <Card className="group h-full border-border/60 bg-card/70 transition-shadow duration-300 hover:border-fiesta-gold/35 hover:shadow-lg hover:shadow-fiesta-gold/10">
                        <CardHeader>
                          <div className="flex size-11 items-center justify-center rounded-xl bg-fiesta-crimson/20 text-fiesta-gold ring-1 ring-fiesta-gold/20 transition-colors group-hover:bg-fiesta-crimson/30 group-hover:shadow-[0_0_24px_rgba(251,191,36,0.15)]">
                            <Icon className="size-5" aria-hidden />
                          </div>
                          <CardTitle className="pt-2 font-[family-name:var(--font-heading)] text-lg">
                            {copy.title}
                          </CardTitle>
                          <CardDescription className="text-pretty">{copy.desc}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  </motion.div>
                </motion.li>
              );
            })}
          </motion.ul>
        </section>
      </div>
    </div>
  );
}
